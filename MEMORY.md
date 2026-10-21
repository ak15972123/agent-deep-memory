# Memory

Durable facts and decisions. Append-only — a correction is a new entry that
supersedes an old one, both visible.

Keep this file under ~80 lines. When it grows past that, the fix is to move a
topic into its own file and leave a pointer, not to trim the history.

Entry format:

```
- YYYY-MM-DD: the fact or decision
  - Why: the reasoning, if it is not obvious
```

---

## Environment

<!-- Replace these with your own. They are examples, not defaults. -->

- 2026-01-01: Primary OS is Linux; the agent runs on the same machine as the editor.
- 2026-01-01: Editor is VS Code. Terminal is the system shell, not an embedded one.

## Decisions

- 2026-01-01: Memory is plain Markdown and JSON, no external database.
  - Why: it has to survive the tool that wrote it. A file outlives a schema.
- 2026-01-01: Memory is organised by role, not by account.
  - Why: switching accounts should not change who the agent is.
- 2026-01-01: Corrections supersede, they do not overwrite.
  - Why: if memory can be silently rewritten, a wrong entry can replace a right
    one and nothing surfaces the change.

## Technical knowledge

<!-- Accumulates as you work. Keep entries short and specific. -->

- (nothing yet)

## Working habits

- 2026-01-01: Record a correction the moment it happens; a preference stated
  once and not written down will be re-learned next session.
