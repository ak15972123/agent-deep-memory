# Agent Deep Memory

> **Your AI agent's memory should belong to you — not to the IDE, the model, or the account you happen to be using.**

A model-agnostic, plain-text memory system for AI coding agents. Switch between Claude, GPT/Codex, Gemini, or Qwen mid-project and the agent still knows who you are, what you decided last week, and which mistakes not to repeat.

---

## The Problem

Every AI coding tool ships its own memory: ChatGPT has memories, Claude has projects, Cursor has rules, Copilot has instructions. They don't talk to each other, and none of them belong to you.

The practical cost:

- **Switch models, lose context.** You move from Gemini to Codex because one is better at a task, and the agent forgets the architecture decisions you spent three hours on.
- **Switch IDEs, start over.** Your `CLAUDE.md` doesn't help you in a Codex session.
- **Switch accounts, lose everything.** Multi-account setups for quota reasons mean memory lives in whichever account happened to be active.
- **Repeat yourself forever.** The same corrections, the same pitfalls, the same "no, we use tabs" — re-taught in every new session.

Vendor memory is a feature of their product. This is infrastructure for *your* work.

## The Approach

**Memory lives in a directory you own, in formats any model can read.**

```
~/.agent-memory/
├── CONSTITUTION.md      # Immutable design law — what this system is and isn't
├── IDENTITY.md          # Who the agent is, independent of model or session
├── MEMORY.md            # Durable facts, decisions, and state
├── PREFERENCES.md       # How you want work done
├── rules.json           # Machine-readable behavioral rules
├── playbooks/           # Reusable methodologies (reasoning, review, coordination)
├── specialists/         # Domain expert overlays
├── skills/              # 141 role definitions across 13 disciplines
├── patterns/            # Recurring solutions worth reusing
├── pitfalls/            # Known failure modes, with symptoms
├── runtime/             # Optional: watchdog and context-injection helpers
└── viking_index.json    # Fast symbol/concept index
```

Three design commitments make this portable:

1. **Plain Markdown + JSON, zero dependencies.** Any model that can read a file can use this. No SDK, no database, no service.
2. **The agent's identity is separate from its runtime.** `IDENTITY.md` says "I am the user's assistant" — not "I am Gemini" or "I am Codex". Swapping the model swaps the engine, not the agent.
3. **Written early, not at session end.** Facts are persisted as they're learned. Sessions end without warning; disk writes don't.

## What's Inside

| Component | Purpose |
|---|---|
| **Constitution** | Immutable design law. Agents read it before structural changes; AI is forbidden from editing it. |
| **Playbooks** | Nine methodologies — chain reasoning, high-agency execution, multi-agent coordination, skill extraction, red-team audit, and more. |
| **Specialists** | 141 role definitions across engineering, design, marketing, testing, product, and 8 other disciplines. Loaded on demand as expert overlays. |
| **Pitfalls** | Failure modes with symptom → cause → fix. The agent checks these before repeating a known mistake. |
| **Patterns** | Solutions worth reusing, with context on when they apply. |
| **Runtime** | Optional Node.js helpers: a watchdog for memory health, a context injector for session bootstrap. |

## Quick Start

```bash
git clone https://github.com/ak15972123/agent-deep-memory ~/.agent-memory
```

Then point your agent at it. For any tool that reads a system prompt or instruction file:

```markdown
<!-- Add to your CLAUDE.md / AGENTS.md / system prompt -->
At session start, read ~/.agent-memory/IDENTITY.md, MEMORY.md, and PREFERENCES.md.
Consult ~/.agent-memory/pitfalls/ before debugging a recurring issue.
Persist new durable facts to MEMORY.md as you learn them.
```

For Codex and other OpenAI-compatible agents, see [`docs/CODEX-INTEGRATION.md`](docs/CODEX-INTEGRATION.md).

## Why This Matters for Codex

Codex is a strong coding agent. What it doesn't ship is a memory layer that survives a model switch — and neither does any competitor.

This project is deliberately **provider-neutral**: it works with Codex today, with Claude Code today, with Gemini CLI today, and with whatever ships next month. The value isn't in binding to one vendor; it's in the memory staying put when the vendor changes.

For an OpenAI OSS maintainer applying to the Codex program, the relevant claim is narrow and checkable: **a working, documented, model-agnostic memory substrate that Codex can read and write, with no lock-in.**

## Design Constraints

These are deliberate, and they explain most of the architecture:

| Constraint | Consequence |
|---|---|
| Must work offline | No cloud sync, no external service, no API keys required for the memory layer itself |
| Must survive model switches | Nothing model-specific in the durable layer |
| Must be readable by a human | Markdown over binary formats; a person can read and fix it by hand |
| Must not corrupt silently | Watchdog validates structure; the constitution is AI-immutable |
| Must stay small | Index-first lookup; archives are pruned, not accumulated |

## Status

Early but real. The memory structure, playbooks, and specialist library are in use daily. The runtime helpers and MCP integration are the current focus.

See [`CURRENT_STATE.md`](CURRENT_STATE.md) for what works today and what doesn't.

## Roadmap

- [x] Core memory structure (constitution, identity, preferences, rules)
- [x] Playbook library (9 methodologies)
- [x] Specialist library (141 roles, 13 disciplines)
- [x] Pitfall and pattern registries
- [x] Runtime watchdog
- [ ] MCP server — expose memory as tools to any MCP client (Codex, Claude, Cursor)
- [ ] CLI — `agent-memory add`, `search`, `prune`, `validate`
- [ ] Session bootstrap — auto-inject relevant memory at conversation start
- [ ] Validation test suite

## License

MIT — see [LICENSE](LICENSE).

---

*Built for people who use more than one AI tool and are tired of re-teaching the same context to each of them.*
