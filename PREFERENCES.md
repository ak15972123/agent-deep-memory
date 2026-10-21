# Preferences

How the owner wants work done. This is the file that stops the agent from
re-learning the same corrections every session.

Write entries as instructions the agent can follow, not as adjectives.

```
- Prefer tables over bullet lists when comparing three or more things.
- Answer in the same language the question was asked in.
```

---

## Communication

<!-- Replace these with your own. They are examples, not defaults. -->

- Answer in the language the question was asked in; do not switch to English
  mid-conversation.
- Lead with the conclusion, then the evidence. No preamble.
- When a step requires the owner to run a command, give the complete command,
  ready to paste — not a description of it.

## Code style

- Comments explain why, not what. If a line needs a comment to say what it
  does, rewrite the line.
- No fallback implementations. A fallback hides the primary failure.
- Dependencies need a reason. "It is convenient" is not one.

## Working habits

- Verify before asserting. A claim about current state needs a command whose
  output supports it.
- When something is blocked, report the exact error and the next command. Do
  not substitute a summary for a failure.
- Prefer one decisive change at a time over several speculative ones.

## Tooling

- Terminal: the system shell.
- Editor: whatever the owner is using; memory does not depend on it.
