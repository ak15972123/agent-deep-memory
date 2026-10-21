# Wiring agent-deep-memory into Claude Code

Same substrate, different client. If you already set this up for Codex
(`codex-setup.md`), skip to step 2 — the memory directory is shared.

## 1. Install the memory substrate

```bash
git clone https://github.com/ak15972123/agent-deep-memory.git
cd agent-deep-memory
./examples/quickstart.sh
```

## 2. Register the MCP server

Claude Code reads MCP servers from `~/.claude.json` or per-project
`.mcp.json`. The `claude mcp add` command writes the right shape:

```bash
claude mcp add agent_memory \
  --command node \
  --args /absolute/path/to/agent-deep-memory/mcp/server.js
```

With the memory root pinned explicitly:

```bash
claude mcp add agent_memory \
  --command node \
  --args /absolute/path/to/agent-deep-memory/mcp/server.js \
  --env AGENT_MEMORY_DIR=/home/you/.agent-memory
```

Check it registered:

```bash
claude mcp list
```

## 3. Use CLAUDE.md as the pointer

Claude Code reads `CLAUDE.md` from the project root and from `~/.claude/`.
Put the pointer in the user-level file so it applies everywhere:

```markdown
## Memory

Durable memory lives at `~/.agent-memory/`.

At session start, read:
- `~/.agent-memory/IDENTITY.md`
- `~/.agent-memory/PREFERENCES.md`
- `~/.agent-memory/CURRENT_STATE.md`

Before starting work that may have been done before, call `memory_search`.
When you learn something durable, call `memory_add`. Transient task state does
not belong in memory.
```

## 4. Sharing memory with Codex

The two clients read the same files. That is the point — a decision recorded
while working in Codex is visible when you switch to Claude Code, because
neither client owns the memory.

The only thing that differs is the config that registers the MCP server:

| Client | Config file | Registration |
|---|---|---|
| Codex CLI | `~/.codex/config.toml` | `[mcp_servers.agent_memory]` table |
| Claude Code | `~/.claude.json` | `claude mcp add` |
| Cursor | `.cursor/mcp.json` | `mcpServers` object |

The memory root (`~/.agent-memory/`) is identical for all three.

## 5. Cursor

Cursor uses the same MCP protocol. In `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "agent_memory": {
      "command": "node",
      "args": ["/absolute/path/to/agent-deep-memory/mcp/server.js"],
      "env": { "AGENT_MEMORY_DIR": "/home/you/.agent-memory" }
    }
  }
}
```

## Notes on the split

**Why not just use CLAUDE.md as memory?** Because it gets truncated when it
grows, and it is per-project. `~/.agent-memory/` is outside the repo, survives
`git clean`, and is shared across projects.

**Why read three files instead of one?** Identity and preferences are stable
and small; current state changes every session. Splitting them means the
expensive-to-read part (state) is isolated from the cheap-to-read part
(identity), and an agent that only needs the cheap part can skip the rest.

**What about skills and playbooks?** Those are reference material, not
session-start context. The agent should reach for them with `memory_search`
when a task matches, not load all 141 up front.
