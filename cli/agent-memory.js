#!/usr/bin/env node
/**
 * agent-memory — command line interface
 *
 * Thin wrapper over the same files the MCP server reads. Useful when you want
 * to inspect or write memory from a shell rather than from an agent.
 *
 * Usage:
 *   agent-memory list
 *   agent-memory search <query> [--limit N] [--skills]
 *   agent-memory add <content> [--file MEMORY.md] [--section "## Notes"] [--why "..."]
 *   agent-memory read <file>
 *   agent-memory validate
 *
 * Zero dependencies.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = process.env.AGENT_MEMORY_DIR || path.join(os.homedir(), '.agent-memory');

const REQUIRED = ['CONSTITUTION.md', 'IDENTITY.md', 'MEMORY.md', 'PREFERENCES.md'];
const SEARCHABLE = ['MEMORY.md', 'PREFERENCES.md', 'IDENTITY.md', 'CONSTITUTION.md',
  'CURRENT_STATE.md', 'playbooks', 'patterns', 'pitfalls', 'specialists'];

const c = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
};

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
  return path.relative(ROOT, p);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--skills') out.skills = true;
    else if (a === '--limit') out.limit = parseInt(argv[++i], 10);
    else if (a === '--file') out.file = argv[++i];
    else if (a === '--section') out.section = argv[++i];
    else if (a === '--why') out.why = argv[++i];
    else out._.push(a);
  }
  return out;
}

// ---------- commands ----------

function cmdList() {
  if (!fs.existsSync(ROOT)) {
    console.error(c.red(`memory root not found: ${ROOT}`));
    console.error(`Create it, or set AGENT_MEMORY_DIR.`);
    process.exit(1);
  }
  const files = walk(ROOT);
  const top = files.filter((f) => !rel(f).startsWith('skills/'));
  console.log(c.bold(`Memory root: ${ROOT}\n`));
  for (const f of top) {
    const st = fs.statSync(f);
    console.log(`  ${rel(f).padEnd(38)} ${c.dim(String(st.size) + ' B')}`);
  }
  console.log(c.dim(`\n  + ${files.length - top.length} files under skills/`));
}

function cmdSearch(args) {
  const query = args._.join(' ').trim();
  if (!query) {
    console.error('usage: agent-memory search <query>');
    process.exit(1);
  }
  const limit = args.limit || 20;
  const roots = args.skills ? [...SEARCHABLE, 'skills'] : SEARCHABLE;

  const files = [];
  for (const r of roots) {
    const full = path.join(ROOT, r);
    if (!fs.existsSync(full)) continue;
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, files);
    else files.push(full);
  }

  const q = query.toLowerCase();
  const hits = [];
  for (const f of files) {
    let text;
    try {
      text = fs.readFileSync(f, 'utf8');
    } catch {
      continue;
    }
    const lines = text.split('\n');
    for (let i = 0; i < lines.length && hits.length < limit; i++) {
      if (lines[i].toLowerCase().includes(q)) {
        hits.push({ file: rel(f), line: i + 1, text: lines[i].trim().slice(0, 240) });
      }
    }
    if (hits.length >= limit) break;
  }

  if (!hits.length) {
    console.log(c.yellow(`No matches for "${query}".`));
    console.log(c.dim(`Searched ${files.length} files.`));
    return;
  }
  console.log(c.bold(`${hits.length} match(es) for "${query}"\n`));
  for (const h of hits) {
    console.log(`${c.green(h.file + ':' + h.line)}`);
    console.log(`  ${h.text}\n`);
  }
}

function cmdAdd(args) {
  const content = args._.join(' ').trim();
  if (!content) {
    console.error('usage: agent-memory add <content> [--file F] [--section S] [--why R]');
    process.exit(1);
  }
  const file = args.file || 'MEMORY.md';
  const section = args.section || '## Notes';
  const target = path.join(ROOT, file);

  const entry = [
    `- ${today()}: ${content}`,
    args.why ? `  - Why: ${args.why}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  let text = '';
  if (fs.existsSync(target)) text = fs.readFileSync(target, 'utf8');
  else fs.mkdirSync(path.dirname(target), { recursive: true });

  if (text.includes(section)) {
    text = text.replace(/\s*$/, '\n') + entry + '\n';
  } else {
    text = text.replace(/\s*$/, '\n') + `\n${section}\n\n${entry}\n`;
  }

  fs.writeFileSync(target, text, 'utf8');
  console.log(c.green(`Appended to ${file}:`));
  console.log(entry);
}

function cmdRead(args) {
  const file = args._[0];
  if (!file) {
    console.error('usage: agent-memory read <file>');
    process.exit(1);
  }
  const target = path.join(ROOT, file);
  if (!fs.existsSync(target)) {
    console.error(c.red(`not found: ${file}`));
    process.exit(1);
  }
  process.stdout.write(fs.readFileSync(target, 'utf8'));
}

function cmdValidate() {
  let problems = 0;
  const ok = (msg) => console.log(`  ${c.green('OK')}   ${msg}`);
  const bad = (msg) => {
    console.log(`  ${c.red('FAIL')} ${msg}`);
    problems++;
  };
  const warn = (msg) => console.log(`  ${c.yellow('WARN')} ${msg}`);

  console.log(c.bold(`Validating ${ROOT}\n`));

  if (!fs.existsSync(ROOT)) {
    bad(`memory root does not exist: ${ROOT}`);
    process.exit(1);
  }
  ok('memory root exists');

  for (const f of REQUIRED) {
    const p = path.join(ROOT, f);
    if (!fs.existsSync(p)) bad(`missing required file: ${f}`);
    else if (fs.statSync(p).size === 0) bad(`empty required file: ${f}`);
    else ok(`${f} present (${fs.statSync(p).size} B)`);
  }

  // rules.json must parse
  const rulesPath = path.join(ROOT, 'rules.json');
  if (fs.existsSync(rulesPath)) {
    try {
      JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
      ok('rules.json parses');
    } catch (e) {
      bad(`rules.json invalid JSON: ${e.message}`);
    }
  }

  // viking_index.json must parse
  const idxPath = path.join(ROOT, 'viking_index.json');
  if (fs.existsSync(idxPath)) {
    try {
      JSON.parse(fs.readFileSync(idxPath, 'utf8'));
      ok('viking_index.json parses');
    } catch (e) {
      bad(`viking_index.json invalid JSON: ${e.message}`);
    }
  }

  // duplicate detection in MEMORY.md
  const memPath = path.join(ROOT, 'MEMORY.md');
  if (fs.existsSync(memPath)) {
    const lines = fs
      .readFileSync(memPath, 'utf8')
      .split('\n')
      .filter((l) => l.trim().startsWith('- '))
      .map((l) => l.trim());
    const seen = new Map();
    let dups = 0;
    for (const l of lines) {
      if (seen.has(l)) dups++;
      else seen.set(l, 1);
    }
    if (dups > 0) warn(`${dups} exact duplicate line(s) in MEMORY.md`);
    else ok(`MEMORY.md has ${lines.length} entries, no exact duplicates`);
  }

  // skills inventory consistency
  const invPath = path.join(ROOT, 'skills', 'agency-inventory.json');
  const skillsDir = path.join(ROOT, 'skills', 'agency');
  if (fs.existsSync(invPath) && fs.existsSync(skillsDir)) {
    const onDisk = walk(skillsDir).filter((f) => f.endsWith('.md')).length;
    let declared = null;
    try {
      const inv = JSON.parse(fs.readFileSync(invPath, 'utf8'));
      declared = Array.isArray(inv) ? inv.length : (inv.count ?? Object.keys(inv).length);
    } catch {
      /* already reported above */
    }
    if (declared !== null && declared !== onDisk) {
      warn(`inventory declares ${declared} skills, ${onDisk} on disk`);
    } else {
      ok(`skills inventory consistent (${onDisk} entries)`);
    }
  }

  console.log();
  if (problems === 0) {
    console.log(c.green('PASS — no blocking problems.'));
  } else {
    console.log(c.red(`${problems} blocking problem(s).`));
    process.exit(1);
  }
}

// ---------- main ----------

function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0];
  const args = parseArgs(argv.slice(1));

  switch (cmd) {
    case 'list':
      return cmdList();
    case 'search':
      return cmdSearch(args);
    case 'add':
      return cmdAdd(args);
    case 'read':
      return cmdRead(args);
    case 'validate':
      return cmdValidate();
    case undefined:
    case '-h':
    case '--help':
    case 'help':
      console.log(`agent-memory — inspect and write the memory substrate

Commands:
  list                          list memory files
  search <query> [--limit N]    search memory (--skills to include the library)
  add <content> [--file F] [--section S] [--why R]
                                append a dated entry
  read <file>                   print a memory file
  validate                      check structure and consistency

Environment:
  AGENT_MEMORY_DIR              memory root (default ~/.agent-memory)`);
      return;
    default:
      console.error(c.red(`unknown command: ${cmd}`));
      console.error('Run "agent-memory help" for usage.');
      process.exit(1);
  }
}

main();
