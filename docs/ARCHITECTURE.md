# Architecture

The system is four layers with one rule between them: **durable state is
plain text on disk, and nothing above the filesystem layer owns it.**

```
┌─────────────────────────────────────────────────────────────┐
│  Clients                                                    │
│  Codex CLI · Claude Code · Cursor · Zed · your own script   │
└───────────────┬─────────────────────────────┬───────────────┘
                │ MCP (JSON-RPC over stdio)   │ direct file read
┌───────────────▼──────────────┐  ┌───────────▼───────────────┐
│  mcp/server.js               │  │  cli/agent-memory.js      │
│  memory_search / add /       │  │  list / search / add /    │
│  list / read                 │  │  read / validate          │
└───────────────┬──────────────┘  └───────────┬───────────────┘
                │                             │
                └──────────┬──────────────────┘
┌──────────────────────────▼──────────────────────────────────┐
│  ~/.agent-memory/          (plain text, no database)        │
│                                                             │
│  CONSTITUTION.md   design law, immutable                    │
│  IDENTITY.md       who the agent is                         │
│  PREFERENCES.md    how the user wants work done             │
│  CURRENT_STATE.md  current focus, changes every session     │
│  MEMORY.md         durable facts and decisions, append-only │
│  rules.json        machine-readable policy                  │
│  viking_index.json symbol index                             │
│                                                             │
│  playbooks/  patterns/  pitfalls/  specialists/  skills/    │
└─────────────────────────────────────────────────────────────┘
```

## Why plain text

A memory store that lives in a database is a memory store you cannot read with
`cat`, cannot diff, cannot grep, cannot back up with `cp`, and cannot hand to a
different tool. Every one of those properties matters more for memory than
query speed does — memory is small (kilobytes per session, not gigabytes) and
read far less often than the code it supports.

The tradeoff is real: `memory_search` reads files on every call, so it is
O(files × lines) instead of an indexed lookup. At the scale this is designed
for — tens of files, thousands of lines — that is tens of milliseconds. If your
memory grows past that, the fix is to split files by topic, not to add a
database.

## Layer responsibilities

**Filesystem** — the only source of truth. Everything above is a view. Delete
the MCP server and the CLI and you still have a working memory system: the
agent reads the files directly.

**CLI** (`cli/agent-memory.js`) — human interface. Five commands. `validate` is
the important one: it is the CI gate that catches a corrupted `MEMORY.md`, a
malformed `rules.json`, or a skills inventory that drifted from disk.

**MCP server** (`mcp/server.js`) — agent interface. Four tools over JSON-RPC
2.0 with Content-Length framing, no SDK. It exists so the agent does not have
to guess at file layout: `memory_search` returns `file:line` and the agent can
decide what to read next.

**Clients** — Codex, Claude Code, Cursor, anything speaking MCP. They differ
only in how they register the server. The memory root is shared, so switching
clients does not lose context. That is the whole point of the project.

## The four-file split

`IDENTITY.md`, `PREFERENCES.md`, `CURRENT_STATE.md`, and `MEMORY.md` are
separate files because they have different read patterns:

| File | Size | Changes | Read when |
|---|---|---|---|
| IDENTITY.md | < 1 KB | rarely | every session start |
| PREFERENCES.md | < 2 KB | on correction | every session start |
| CURRENT_STATE.md | < 2 KB | every session | every session start |
| MEMORY.md | grows | append-only | on demand, via search |

Merging them into one file would mean re-reading everything to get the cheap
part. Splitting means an agent that only needs identity and preferences can
skip the rest.

## Append-only memory

`memory_add` appends. It never rewrites, never reorders, never deletes.

This is not laziness — it is the property that makes memory trustworthy. If
memory can be silently rewritten, then a wrong entry can replace a right one
and you have no way to notice. With append-only, a correction is a new entry
that supersedes an old one, both visible, and the history of what the agent
believed is intact.

Deletion is a separate, deliberate act — a human editing the file. The tools
do not do it.

## Deterministic work vs. judgment work

The runtime helpers in `runtime/` follow one rule: **deterministic chores run
unattended; judgment calls become proposals.**

- Cleaning up duplicate lines, normalizing dates, rebuilding an index — these
  are mechanical and run on a schedule.
- Deleting an entry, merging two conflicting entries, deciding which of two
  memories is correct — these are judgment calls. They produce a proposal that
  a human approves.

The rule exists because the failure mode of an autonomous memory system is not
"it stops working" — it is "it quietly deletes the thing you needed." Anything
irreversible gets a human in the loop.

## What is deliberately absent

**No embeddings, no vector search.** Keyword search over a few thousand lines
is fast enough, and it has a property vector search does not: when it misses,
you can see exactly why. A vector index that returns the wrong memory gives you
no way to debug it.

**No sync service.** The memory directory is a directory. Use git, Syncthing,
rsync, or a USB stick. A sync service would be a fifth layer that owns state,
which breaks the one rule.

**No schema migration.** Files are Markdown and JSON. Adding a field means
adding a field; old entries without it still parse. There is nothing to
migrate.

**No model integration.** The project never calls an LLM. It stores text and
returns text. Which model reads it is the client's business, and that is what
makes model swaps free.
