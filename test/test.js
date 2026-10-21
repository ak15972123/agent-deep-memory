#!/usr/bin/env node
/**
 * Tests for the CLI and MCP server.
 *
 * Uses the Node.js built-in test runner (node:test) — no dependencies.
 *
 * Run: node --test test/
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync, spawn } = require('node:child_process');

const REPO = path.resolve(__dirname, '..');
const CLI = path.join(REPO, 'cli', 'agent-memory.js');
const MCP = path.join(REPO, 'mcp', 'server.js');

/** Build a throwaway memory root with a known shape. */
function makeFixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'adm-test-'));
  fs.writeFileSync(
    path.join(dir, 'CONSTITUTION.md'),
    '# Constitution\n\nImmutable design law.\n'
  );
  fs.writeFileSync(path.join(dir, 'IDENTITY.md'), '# Identity\n\nI am the assistant.\n');
  fs.writeFileSync(
    path.join(dir, 'MEMORY.md'),
    '# Memory\n\n## Decisions\n\n- 2026-10-01: Use Postgres LISTEN/NOTIFY.\n'
  );
  fs.writeFileSync(path.join(dir, 'PREFERENCES.md'), '# Preferences\n\n- Tabs, not spaces.\n');
  fs.writeFileSync(path.join(dir, 'rules.json'), JSON.stringify({ rules: [] }));
  fs.writeFileSync(path.join(dir, 'viking_index.json'), JSON.stringify({ symbols: {} }));
  fs.mkdirSync(path.join(dir, 'pitfalls'), { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'pitfalls', 'INDEX.md'),
    '# Pitfalls\n\n## Retry storms\n\nSymptom: 429 flood.\n'
  );
  return dir;
}

function runCli(args, env) {
  return execFileSync(process.execPath, [CLI, ...args], {
    env: { ...process.env, AGENT_MEMORY_DIR: env },
    encoding: 'utf8',
  });
}

/** Send a sequence of JSON-RPC requests to the MCP server, return parsed responses. */
function callMcp(memoryDir, requests, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const p = spawn(process.execPath, [MCP], {
      env: { ...process.env, AGENT_MEMORY_DIR: memoryDir },
    });
    let buf = Buffer.alloc(0);
    const responses = [];
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      p.kill();
      resolve(responses);
    };
    const timer = setTimeout(finish, timeoutMs);

    p.stdout.on('data', (d) => {
      buf = Buffer.concat([buf, d]);
      for (;;) {
        const sep = buf.indexOf('\r\n\r\n');
        if (sep === -1) break;
        const header = buf.subarray(0, sep).toString('ascii');
        const m = /Content-Length:\s*(\d+)/i.exec(header);
        if (!m) {
          buf = buf.subarray(sep + 4);
          continue;
        }
        const len = parseInt(m[1], 10);
        const start = sep + 4;
        if (buf.length < start + len) break;
        try {
          responses.push(JSON.parse(buf.subarray(start, start + len).toString('utf8')));
        } catch (e) {
          clearTimeout(timer);
          p.kill();
          return reject(e);
        }
        buf = buf.subarray(start + len);
      }
    });

    let i = 0;
    const expected = requests.filter((r) => r.id !== undefined).length;
    const maybeFinish = () => {
      if (responses.length >= expected) setTimeout(finish, 100);
    };
    const sendNext = () => {
      if (i >= requests.length) {
        setTimeout(finish, 1500);
        return;
      }
      const s = JSON.stringify(requests[i++]);
      p.stdin.write(`Content-Length: ${Buffer.byteLength(s)}\r\n\r\n${s}`);
      setTimeout(sendNext, 250);
    };
    p.stdout.on('data', () => maybeFinish());
    sendNext();
  });
}

// ---------- CLI ----------

test('cli: list shows required files', () => {
  const dir = makeFixture();
  const out = runCli(['list'], dir);
  assert.match(out, /CONSTITUTION\.md/);
  assert.match(out, /MEMORY\.md/);
});

test('cli: search returns file:line for a known term', () => {
  const dir = makeFixture();
  const out = runCli(['search', 'LISTEN'], dir);
  assert.match(out, /MEMORY\.md:\d+/);
  assert.match(out, /LISTEN\/NOTIFY/);
});

test('cli: search reports zero matches without failing', () => {
  const dir = makeFixture();
  const out = runCli(['search', 'nonexistent-term-xyz'], dir);
  assert.match(out, /No matches/);
});

test('cli: add appends a dated entry and is readable back', () => {
  const dir = makeFixture();
  runCli(['add', 'Avoid Redis for queues', '--why', 'ops burden'], dir);
  const mem = fs.readFileSync(path.join(dir, 'MEMORY.md'), 'utf8');
  assert.match(mem, /Avoid Redis for queues/);
  assert.match(mem, /Why: ops burden/);
  const today = new Date().toISOString().slice(0, 10);
  assert.ok(mem.includes(today), 'entry should carry today\'s date');
});

test('cli: add never truncates existing content', () => {
  const dir = makeFixture();
  const before = fs.readFileSync(path.join(dir, 'MEMORY.md'), 'utf8');
  runCli(['add', 'New fact'], dir);
  const after = fs.readFileSync(path.join(dir, 'MEMORY.md'), 'utf8');
  assert.ok(after.startsWith(before.trimEnd()), 'existing content must survive');
});

test('cli: validate passes on a well-formed root', () => {
  const dir = makeFixture();
  const out = runCli(['validate'], dir);
  assert.match(out, /PASS/);
});

test('cli: validate fails when a required file is missing', () => {
  const dir = makeFixture();
  fs.unlinkSync(path.join(dir, 'IDENTITY.md'));
  assert.throws(() => runCli(['validate'], dir), /Command failed|FAIL/);
});

test('cli: validate detects malformed JSON', () => {
  const dir = makeFixture();
  fs.writeFileSync(path.join(dir, 'rules.json'), '{ not json');
  assert.throws(() => runCli(['validate'], dir), /Command failed|FAIL/);
});

// ---------- MCP ----------

test('mcp: initialize returns server info', async () => {
  const dir = makeFixture();
  const res = await callMcp(dir, [
    {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 't', version: '1' } },
    },
  ]);
  const init = res.find((r) => r.id === 1);
  assert.ok(init, 'initialize response missing');
  assert.strictEqual(init.result.serverInfo.name, 'agent-deep-memory');
});

test('mcp: tools/list exposes four tools', async () => {
  const dir = makeFixture();
  const res = await callMcp(dir, [
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 't', version: '1' } } },
    { jsonrpc: '2.0', id: 2, method: 'tools/list' },
  ]);
  const list = res.find((r) => r.id === 2);
  const names = list.result.tools.map((t) => t.name).sort();
  assert.deepStrictEqual(names, ['memory_add', 'memory_list', 'memory_read', 'memory_search']);
});

test('mcp: memory_search finds a term', async () => {
  const dir = makeFixture();
  const res = await callMcp(dir, [
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 't', version: '1' } } },
    { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'memory_search', arguments: { query: 'LISTEN' } } },
  ]);
  const r = res.find((x) => x.id === 2);
  const text = r.result.content[0].text;
  assert.match(text, /MEMORY\.md/);
});

test('mcp: memory_add writes through to disk', async () => {
  const dir = makeFixture();
  await callMcp(dir, [
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 't', version: '1' } } },
    { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'memory_add', arguments: { content: 'MCP wrote this', rationale: 'test' } } },
  ]);
  const mem = fs.readFileSync(path.join(dir, 'MEMORY.md'), 'utf8');
  assert.match(mem, /MCP wrote this/);
});

test('mcp: unknown tool returns an error, not a crash', async () => {
  const dir = makeFixture();
  const res = await callMcp(dir, [
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 't', version: '1' } } },
    { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'no_such_tool', arguments: {} } },
  ]);
  const r = res.find((x) => x.id === 2);
  assert.ok(r.error, 'should return a JSON-RPC error');
  assert.strictEqual(r.error.code, -32601);
});
