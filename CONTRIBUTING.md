# Contributing

## What this project is for

A memory substrate that outlives the tool reading it. If a change makes memory
depend on a specific client, model, vendor, or service, it goes against the
grain and will probably be rejected.

## The constraints worth knowing before you write code

**No dependencies.** Not in `mcp/`, not in `cli/`, not in `runtime/`. The whole
point is that this keeps working when an SDK changes or a package is
unmaintained. Node 18+ and the standard library only.

**Plain text stays plain.** Memory is Markdown and JSON on disk. A change that
introduces a binary format, a database, or an index that must be rebuilt before
the files are readable will be rejected.

**Append, do not rewrite.** `memory_add` appends. Tools do not delete or reorder
entries. Deletion is a human editing a file. If you need a correction
primitive, propose it as a new entry that supersedes the old one.

**Deterministic chores run unattended; judgment calls become proposals.** Any
automation that could delete or merge memory must emit a proposal, not act.

## Getting set up

```bash
git clone https://github.com/ak15972123/agent-deep-memory.git
cd agent-deep-memory
node --version   # must be 18 or newer
npm test         # 13 tests, no install step
```

There is no build. `npm install` does nothing — there are no dependencies.

## Testing

```bash
npm test                              # all tests
node --test test/test.js              # same thing
```

Tests use the Node built-in runner. Each test builds a throwaway memory root in
`os.tmpdir()`, so tests do not touch your real memory and can run in parallel.

If you add a tool to the MCP server, add a test that calls it through the
framed JSON-RPC path — not by importing the handler directly. The framing layer
is where the bugs are: a Content-Length mismatch against a multi-byte character
once stalled the reader silently, and only an end-to-end test would catch that.

## Adding a memory file

If you think a new top-level file is needed, ask first in an issue. The current
split (identity / preferences / state / memory) exists because those four have
different read patterns; adding a fifth needs a reason that is not "it is
tidier."

Reference libraries (`playbooks/`, `patterns/`, `pitfalls/`, `specialists/`,
`skills/`) are different — those are content, and additions are welcome. Match
the existing front matter and keep entries short.

## Adding an MCP tool

1. Add the tool to `TOOLS` in `mcp/server.js` with a description that says when
   to use it, not just what it does.
2. Add a handler to `HANDLERS`.
3. Add a test that exercises it over the wire.
4. Update `docs/CODEX-INTEGRATION.md` and both files in `examples/`.

Four tools is not a limit, but every tool costs context in every client that
loads the server. A tool that is only useful in one narrow situation is better
as a CLI command.

## Commit messages

Explain why, not what. The diff already says what changed. A good message says
what the old behavior was, why it was wrong, and what the new behavior is.

## Reporting a bug

Include:

- Node version (`node --version`)
- The command or tool call that failed
- What you expected and what happened
- Whether `node cli/agent-memory.js validate` passes on your memory root

If the bug involves memory content, do not paste your real memory — reproduce
with the fixture in `test/test.js`, which is synthetic.
