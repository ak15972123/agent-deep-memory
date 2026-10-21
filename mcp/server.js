#!/usr/bin/env node
/**
 * agent-deep-memory — MCP server
 *
 * Exposes the memory substrate over the Model Context Protocol so any MCP
 * client (Codex, Claude Code, Cursor, Zed) can read and write memory as
 * tools instead of doing file I/O by hand.
 *
 * Zero dependencies: implements the JSON-RPC 2.0 framing over stdio directly.
 *
 * Tools:
 *   memory_search  — full-text search across memory files
 *   memory_add     — append a dated entry to a memory file
 *   memory_list    — list available memory files
 *   memory_read    — read a specific memory file
 *
 * Usage (add to your MCP client config):
 *   { "command": "node", "args": ["/path/to/agent-deep-memory/mcp/server.js"] }
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const MEMORY_ROOT =
  process.env.AGENT_MEMORY_DIR || path.join(os.homedir(), '.agent-memory');

const SERVER_INFO = { name: 'agent-deep-memory', version: '0.1.0' };
const PROTOCOL_VERSION = '2024-11-05';

// Directories that hold durable memory. skills/ is excluded from search by
// default — it is a large static library and would swamp every query.
const SEARCHABLE = ['MEMORY.md', 'PREFERENCES.md', 'IDENTITY.md', 'CONSTITUTION.md',
  'CURRENT_STATE.md', 'playbooks', 'patterns', 'pitfalls', 'specialists'];

const TOOLS = [
  {
    name: 'memory_search',
    description:
      'Search the memory substrate for a term or phrase. Returns matching lines ' +
      'with file and line number. Use before starting work that may have been ' +
      'done before, and before recording a new fact.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Term or phrase to search for' },
        limit: { type: 'number', description: 'Max results (default 20)' },
        include_skills: {
          type: 'boolean',
          description: 'Also search the 141-entry skills library (slow, noisy)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'memory_add',
    description:
      'Append a dated entry to a memory file. Use for durable facts, decisions, ' +
      'and corrections — not for transient task state. Appends only; never rewrites.',
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'The fact or decision to record' },
        section: {
          type: 'string',
          description: 'Heading to append under (default: "## Notes")',
        },
        file: {
          type: 'string',
          description: 'Target file (default MEMORY.md)',
        },
        rationale: {
          type: 'string',
          description: 'Why this matters — recorded alongside the fact',
        },
      },
      required: ['content'],
    },
  },
  {
    name: 'memory_list',
    description: 'List the memory files available in the substrate.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'memory_read',
    description: 'Read a memory file in full. Use for IDENTITY, PREFERENCES, or CURRENT_STATE.',
    inputSchema: {
      type: 'object',
      properties: {
        file: { type: 'string', description: 'File path relative to memory root' },
      },
      required: ['file'],
    },
  },
];

// ---------- helpers ----------

function walk(dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (/\.(md|json)$/i.test(e.name)) out.push(full);
  }
  return out;
}

function rel(p) {
  return path.relative(MEMORY_ROOT, p);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// ---------- tool implementations ----------

function memorySearch({ query, limit = 20, include_skills = false }) {
  if (!query || !query.trim()) {
    return { content: [{ type: 'text', text: 'query is required' }], isError: true };
  }
  const q = query.toLowerCase();
  const roots = include_skills ? [...SEARCHABLE, 'skills'] : SEARCHABLE;
  const files = [];
  for (const r of roots) {
    const full = path.join(MEMORY_ROOT, r);
    if (!fs.existsSync(full)) continue;
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, files);
    else files.push(full);
  }

  const hits = [];
  for (const f of files) {
    let text;
    try {
      text = fs.readFileSync(f, 'utf8');
    } catch {
      continue;
    }
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(q)) {
        hits.push({ file: rel(f), line: i + 1, text: lines[i].trim().slice(0, 300) });
        if (hits.length >= limit) break;
      }
    }
    if (hits.length >= limit) break;
  }

  if (!hits.length) {
    return {
      content: [
        {
          type: 'text',
          text: `No matches for "${query}" in the memory substrate.\n\nSearched ${files.length} files. This likely means the fact has not been recorded yet — consider adding it with memory_add.`,
        },
      ],
    };
  }

  const body = hits
    .map((h) => `${h.file}:${h.line}\n  ${h.text}`)
    .join('\n\n');
  return {
    content: [
      {
        type: 'text',
        text: `Found ${hits.length} match(es) for "${query}":\n\n${body}`,
      },
    ],
  };
}

function memoryAdd({ content, section = '## Notes', file = 'MEMORY.md', rationale }) {
  if (!content || !content.trim()) {
    return { content: [{ type: 'text', text: 'content is required' }], isError: true };
  }
  const target = path.join(MEMORY_ROOT, file);
  if (!target.startsWith(MEMORY_ROOT)) {
    return { content: [{ type: 'text', text: 'invalid file path' }], isError: true };
  }

  const entry = [
    `- ${today()}: ${content.trim()}`,
    rationale ? `  - Why: ${rationale.trim()}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  let text = '';
  if (fs.existsSync(target)) text = fs.readFileSync(target, 'utf8');
  else fs.mkdirSync(path.dirname(target), { recursive: true });

  if (text.includes(section)) {
    // Append at end of file under the existing section is ambiguous; append to
    // end of file with the section header repeated only if it is the last one.
    text = text.replace(/\s*$/, '\n') + entry + '\n';
  } else {
    text = text.replace(/\s*$/, '\n') + `\n${section}\n\n${entry}\n`;
  }

  fs.writeFileSync(target, text, 'utf8');
  return {
    content: [
      { type: 'text', text: `Appended to ${file}:\n\n${entry}` },
    ],
  };
}

function memoryList() {
  const files = walk(MEMORY_ROOT);
  const top = files.filter((f) => !rel(f).startsWith('skills/'));
  const body = top
    .map((f) => {
      const st = fs.statSync(f);
      return `${rel(f)}  (${st.size} bytes)`;
    })
    .join('\n');
  return {
    content: [
      {
        type: 'text',
        text: `Memory root: ${MEMORY_ROOT}\n\n${body || '(empty)'}\n\nPlus ${files.length - top.length} files under skills/.`,
      },
    ],
  };
}

function memoryRead({ file }) {
  const target = path.join(MEMORY_ROOT, file);
  if (!target.startsWith(MEMORY_ROOT) || !fs.existsSync(target)) {
    return { content: [{ type: 'text', text: `not found: ${file}` }], isError: true };
  }
  const st = fs.statSync(target);
  if (st.size > 200_000) {
    return {
      content: [{ type: 'text', text: `${file} is ${st.size} bytes — too large to return whole. Use memory_search instead.` }],
    };
  }
  return { content: [{ type: 'text', text: fs.readFileSync(target, 'utf8') }] };
}

const HANDLERS = {
  memory_search: memorySearch,
  memory_add: memoryAdd,
  memory_list: memoryList,
  memory_read: memoryRead,
};

// ---------- JSON-RPC over stdio ----------

function send(msg) {
  const json = JSON.stringify(msg);
  process.stdout.write(`Content-Length: ${Buffer.byteLength(json)}\r\n\r\n${json}`);
}

function handle(req) {
  const { id, method, params } = req;

  if (method === 'initialize') {
    return send({
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
      },
    });
  }

  if (method === 'notifications/initialized') return; // no response

  if (method === 'tools/list') {
    return send({ jsonrpc: '2.0', id, result: { tools: TOOLS } });
  }

  if (method === 'tools/call') {
    const name = params?.name;
    const fn = HANDLERS[name];
    if (!fn) {
      return send({
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `unknown tool: ${name}` },
      });
    }
    try {
      const result = fn(params.arguments || {});
      return send({ jsonrpc: '2.0', id, result });
    } catch (e) {
      return send({
        jsonrpc: '2.0',
        id,
        result: {
          content: [{ type: 'text', text: `tool error: ${e.message}` }],
          isError: true,
        },
      });
    }
  }

  if (id !== undefined) {
    send({ jsonrpc: '2.0', id, error: { code: -32601, message: `unknown method: ${method}` } });
  }
}

// Minimal Content-Length framed reader.
let buf = '';
process.stdin.on('data', (chunk) => {
  buf += chunk.toString('utf8');
  for (;;) {
    const sep = buf.indexOf('\r\n\r\n');
    if (sep === -1) break;
    const header = buf.slice(0, sep);
    const m = /Content-Length:\s*(\d+)/i.exec(header);
    if (!m) {
      buf = buf.slice(sep + 4);
      continue;
    }
    const len = parseInt(m[1], 10);
    const bodyStart = sep + 4;
    if (buf.length < bodyStart + len) break;
    const body = buf.slice(bodyStart, bodyStart + len);
    buf = buf.slice(bodyStart + len);
    try {
      handle(JSON.parse(body));
    } catch (e) {
      process.stderr.write(`parse error: ${e.message}\n`);
    }
  }
});

process.stdin.on('end', () => process.exit(0));
