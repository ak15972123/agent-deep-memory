# Codex Integration

How to wire `agent-deep-memory` into OpenAI Codex (CLI, IDE extension, or cloud agent).

The memory layer is provider-neutral by design. Nothing here is Codex-specific at the data level — Codex just happens to be the tool you're using right now. The same directory serves Claude Code, Gemini CLI, and Cursor unchanged.

---

## 1. Placement

Codex reads instruction files from the repository root and from the user's home directory. Put the memory somewhere stable:

```bash
git clone https://github.com/ak15972123/agent-deep-memory ~/.agent-memory
```

Then create a thin pointer at the location Codex reads. For repo-level work:

```bash
# In the project you're working on
ln -s ~/.agent-memory/IDENTITY.md ./AGENTS.md     # or append to an existing AGENTS.md
```

Or, better, keep `AGENTS.md` project-specific and reference memory explicitly:

```markdown
<!-- AGENTS.md -->
## Memory

This project uses a shared memory substrate at `~/.agent-memory/`.

At session start, read:
1. `~/.agent-memory/IDENTITY.md` — who you are in this workspace
2. `~/.agent-memory/MEMORY.md` — durable facts and decisions
3. `~/.agent-memory/PREFERENCES.md` — how I want work done

Before debugging a recurring issue, check `~/.agent-memory/pitfalls/`.

When you learn something durable (an architecture decision, a hard-won
constraint, a correction I made), append it to `MEMORY.md` in the
existing format. Do not rewrite the file.
```

That's the whole integration. No SDK, no daemon.

## 2. What Codex Actually Gets

Once the pointer is in place, three behaviors change:

**Context survives the session.** Decisions recorded in `MEMORY.md` are available next time, in any tool. Not just Codex — Claude Code reading the same file sees the same context.

**Corrections stick.** When you correct the agent and it writes the correction to `PREFERENCES.md` or `pitfalls/`, the correction applies to every future session and every future model.

**The agent has a stable identity.** `IDENTITY.md` says the agent is *your* assistant, not a model persona. Switching from `gpt-5-codex` to another model swaps the engine; the working relationship is continuous.

## 3. A Concrete Workflow

**Session 1 — Codex CLI, architecture work**

```
You: Let's use a message queue between the API and the worker.
Codex: [proposes Redis Streams]
You: No — we're avoiding Redis, ops burden. Use Postgres LISTEN/NOTIFY.
Codex: [implements, then writes to ~/.agent-memory/MEMORY.md]
       ## Architecture decisions
       - 2026-10-21: Async work between API and worker uses Postgres
         LISTEN/NOTIFY. Redis explicitly rejected — ops burden outweighs
         throughput benefit at current scale.
```

**Session 2 — different model, different tool, same project**

The agent reads `MEMORY.md` at startup and does not propose Redis. The decision was made once and persisted.

**Session 3 — six months later, new maintainer**

`MEMORY.md` explains why. The reasoning outlived the conversation, the model, and the person.

## 4. Writing Rules (for the agent)

Give the agent these constraints when it writes to memory:

| Rule | Reason |
|---|---|
| Append, never rewrite | Rewrites lose history and can silently drop facts |
| One fact per entry, with a date | Makes pruning possible; undated entries can't be aged out |
| Record the *why*, not just the *what* | "Use Postgres LISTEN/NOTIFY" is useless without "Redis rejected for ops burden" |
| Never store secrets | The memory is plain text on disk and often synced |
| Mark superseded entries, don't delete | A rejected approach is itself a decision worth keeping |

## 5. What's Not Here Yet

Honest status, because the roadmap matters more than the claim:

- **No MCP server.** Today the integration is file-based — the agent reads and writes Markdown. An MCP server that exposes `memory.search` / `memory.add` as tools is the next milestone and would remove the need for the agent to do file I/O manually.
- **No automatic context injection.** The agent has to be told to read the files. Session-start hooks exist for some tools (Claude Code) but not for Codex CLI yet.
- **No pruning automation.** `watchdog.js` validates structure but doesn't yet age out stale entries.

These are the three things standing between "useful today" and "frictionless."

## 6. Why File-Based First

It would be easy to ship a SQLite database or a small service instead. The reason not to:

- A file is readable by any tool, including ones that don't exist yet
- A file survives tool churn — this project has already outlived two IDE changes
- A file is debuggable by a human at 2am without a client library
- A file has no version skew between the memory format and the reader

The MCP server, when it lands, will be a *thin layer over the same files* — not a replacement for them.

---

## See Also

- [`README.md`](../README.md) — what this project is and why
- [`CONSTITUTION.md`](../CONSTITUTION.md) — the design law
- [`CURRENT_STATE.md`](../CURRENT_STATE.md) — what works today
