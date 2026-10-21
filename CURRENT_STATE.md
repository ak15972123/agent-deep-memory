# Current State

Last updated: 2026-10-21 · version 0.1.0

This file is read at the start of every session. It holds what is true *now* —
what works, what doesn't, and what is being worked on. Durable facts belong in
`MEMORY.md`; conventions belong in `PREFERENCES.md`.

## What works

| Component | State | Verified by |
|---|---|---|
| Memory structure (4 files + rules.json) | Working | `agent-memory validate` |
| MCP server (4 tools) | Working | `npm test` — 13/13 |
| CLI (5 commands) | Working | `npm test` — 13/13 |
| Reference libraries (9 playbooks, 8 pitfalls, 2 patterns, 141 specialists) | Working | inventory check in `validate` |
| Quickstart bootstrap | Working | fresh-clone end-to-end run |

## What does not work yet

**Session bootstrap.** The agent is told to read `IDENTITY.md`,
`PREFERENCES.md`, and `CURRENT_STATE.md` at session start, but nothing enforces
it. If the agent skips the read, memory is silently unused. A client-side hook
is the fix; it is not built.

**Concurrent writes.** Two `memory_add` calls at the same instant can
interleave and produce a malformed entry. Fine for a single agent on one
machine, not safe for a shared memory root.

**Search scaling.** `memory_search` reads every file on every call. At a few
thousand lines this is tens of milliseconds. At hundreds of thousands it is
slow enough to matter, and the fix is splitting files by topic rather than
adding an index.

**No CI.** Tests run locally with `npm test`. Nothing blocks a broken commit.

## Open work

1. **Session bootstrap hook** — auto-inject relevant memory at conversation
   start instead of relying on the agent to remember.
2. **Concurrent-write protection** — a lock protocol that works across
   processes without a daemon.
3. **CI** — run `npm test` and `agent-memory validate` on every push.
4. **Client coverage** — verified against Codex and Claude Code config shapes;
   Cursor and Zed are documented but not exercised end to end.

## Known rough edges

- The reference libraries (`playbooks/`, `specialists/`, `skills/`) were
  written for one workflow and have not been validated by other users. Some
  entries assume tooling that is not part of this repository.
- `viking_index.json` is a symbol-index schema with example entries. It parses
  and `validate` checks it, but nothing consumes it yet — the MCP server does
  not use it for lookup.
- Tool descriptions in `mcp/server.js` are the only place the "when to use
  this" guidance lives. A client that ignores descriptions gets less value.
