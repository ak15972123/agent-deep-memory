# Wiring agent-deep-memory into Codex

Codex reads context from `AGENTS.md` and can call MCP servers as tools. This
gives you both halves: durable memory the model reads, and memory tools it can
call.

## 1. Install the memory substrate

```bash
git clone https://github.com/ak15972123/agent-deep-memory.git
cd agent-deep-memory
./examples/quickstart.sh
```

That creates `~/.agent-memory/` with the four required files and copies the
playbooks, patterns, pitfalls, specialists, and skills libraries.

Edit `~/.agent-memory/IDENTITY.md` and `~/.agent-memory/PREFERENCES.md` before
going further — those two files are what stop the agent from re-learning your
setup every session.

## 2. Register the MCP server

Codex CLI reads MCP servers from `~/.codex/config.toml`:

```toml
[mcp_servers.agent_memory]
command = "node"
args = ["/absolute/path/to/agent-deep-memory/mcp/server.js"]

[mcp_servers.agent_memory.env]
AGENT_MEMORY_DIR = "/home/you/.agent-memory"
```

Use absolute paths. Codex launches the server with its own working directory,
so a relative path resolves to the wrong place.

Verify it loaded:

```bash
codex mcp list
```

You should see `agent_memory` with four tools: `memory_search`, `memory_add`,
`memory_list`, `memory_read`.

## 3. Point AGENTS.md at the memory root

In the repository you are working in, add to `AGENTS.md`:

```markdown
## Memory

Durable memory lives at `~/.agent-memory/`. Before starting work:

1. Read `IDENTITY.md` and `PREFERENCES.md` — they define how I want you to work.
2. Read `CURRENT_STATE.md` — it holds the current focus and open threads.
3. Call `memory_search` before assuming something has not been decided before.

When you learn something durable — a decision, a correction, a constraint that
will still matter next week — call `memory_add`. Do not record transient task
state; that belongs in the task, not in memory.
```

The three-file read is deliberate. Identity and preferences are small and
change rarely; current state changes every session. Loading them separately
keeps the common case cheap.

## 4. What actually changes

Without memory, every session starts with the agent re-deriving your stack,
your conventions, and the decisions you already made. With it:

- **Model swaps are free.** Switch Codex from one model to another mid-project;
  the memory files are plain text and do not care which model reads them.
- **Corrections stick.** Tell the agent once that you want tables not bullet
  lists for comparisons; it goes in `PREFERENCES.md` and stays.
- **Tool switches are cheap.** The same `~/.agent-memory/` works for Claude
  Code and Cursor — see `claude-code-setup.md`.

## 5. Maintenance

```bash
# what is in memory
node cli/agent-memory.js list

# search
node cli/agent-memory.js search "postgres"

# structural check — run this in CI
node cli/agent-memory.js validate
```

`validate` checks that the required files exist and are non-empty, that
`rules.json` and `viking_index.json` parse, that `MEMORY.md` has no exact
duplicate lines, and that the skills inventory matches what is on disk.

## Troubleshooting

**Tools do not appear in `codex mcp list`.** Check the path in
`config.toml` is absolute and that `node --version` is 18 or newer.

**`memory_search` returns nothing.** Check `AGENT_MEMORY_DIR` points at the
right directory. The server falls back to `~/.agent-memory` when the variable
is unset, which is not always what you want.

**Search is slow.** It reads files on every call. If your `skills/` directory
is large, leave `include_skills` off — it is off by default for this reason.
