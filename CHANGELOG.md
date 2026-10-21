# Changelog

## 0.1.0 — 2026-10-21

First public release. The repository was assembled from two prior internal
repositories and then rewritten for portability.

### Added

- **MCP server** (`mcp/server.js`) — four tools over JSON-RPC 2.0 with
  Content-Length framing. Zero dependencies, no build step.
  - `memory_search` — full-text search, returns `file:line`
  - `memory_add` — append a dated entry with optional rationale
  - `memory_list` — list memory files with sizes
  - `memory_read` — read one file whole, size-capped
- **CLI** (`cli/agent-memory.js`) — `list`, `search`, `add`, `read`, `validate`.
  `validate` is the CI gate: required files, JSON validity, duplicate detection,
  and skills-inventory consistency.
- **Test suite** (`test/test.js`) — 13 tests on the Node built-in runner,
  covering the CLI and the MCP server end to end.
- **Examples** — `quickstart.sh` bootstraps a memory root idempotently;
  `codex-setup.md` and `claude-code-setup.md` cover client registration.
- **Architecture notes** (`docs/ARCHITECTURE.md`) — layer responsibilities and
  the tradeoffs taken deliberately, including what is absent and why.
- **Memory libraries** — 9 playbooks, 8 pitfalls, 2 patterns, 141 specialist
  role definitions across 13 disciplines.

### Changed

- Memory root is now resolved from `AGENT_MEMORY_DIR` or `~/.agent-memory`,
  replacing the hardcoded Windows paths (`C:\Users\...\.gemini\memory`) the
  runtime helpers were written against.
- `CONSTITUTION.md` and `IDENTITY.md` no longer name a specific IDE, account
  count, or installation path. The project is client-agnostic by design; the
  documents now say so.
- Removed `antigravity_hotpatch.js` — an IDE localization patch that had
  nothing to do with memory.

### Known limitations

- `memory_search` reads files on every call. Fine at thousands of lines, slow
  at hundreds of thousands. Split files by topic rather than adding an index.
- No concurrent-write protection. Two `memory_add` calls at the same instant
  can interleave. Acceptable for a single-agent workflow, not for a shared
  root with several writers.
- `validate` checks structure, not content. It cannot tell you that a memory
  entry is wrong, only that the file is well-formed.
