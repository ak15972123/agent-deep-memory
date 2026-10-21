#!/usr/bin/env bash
# Bootstrap a memory substrate in ~/.agent-memory.
#
# Usage:  ./examples/quickstart.sh [target-dir]
#
# Creates the directory skeleton and seeds the four required files with
# starter content. Safe to re-run: existing files are never overwritten.

set -euo pipefail

ROOT="${1:-$HOME/.agent-memory}"
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "memory root: $ROOT"
mkdir -p "$ROOT"/{playbooks,patterns,pitfalls,specialists,skills}

seed() {
  local dest="$ROOT/$1"
  if [ -e "$dest" ]; then
    echo "  skip  $1 (exists)"
    return
  fi
  cp "$REPO/$1" "$dest"
  echo "  seed  $1"
}

# The four files the validator requires, plus state.
for f in CONSTITUTION.md IDENTITY.md MEMORY.md PREFERENCES.md CURRENT_STATE.md rules.json; do
  if [ -f "$REPO/$f" ]; then
    seed "$f"
  fi
done

# Copy the libraries only when the destination is empty, so a second run
# does not clobber edits.
for d in playbooks patterns pitfalls specialists skills; do
  if [ -d "$REPO/$d" ] && [ -z "$(ls -A "$ROOT/$d" 2>/dev/null || true)" ]; then
    cp -R "$REPO/$d/." "$ROOT/$d/"
    echo "  copy  $d/"
  fi
done

echo
echo "Validating..."
AGENT_MEMORY_DIR="$ROOT" node "$REPO/cli/agent-memory.js" validate

echo
cat <<EOF
Next steps:

  1. Edit $ROOT/IDENTITY.md and $ROOT/PREFERENCES.md to describe your setup.
     These are read by the agent at the start of every session.

  2. Point your agent at the memory root. For Codex, add to AGENTS.md:

       Memory lives at $ROOT. Read IDENTITY.md, PREFERENCES.md,
       and CURRENT_STATE.md before starting work. Use the memory_search and
       memory_add tools when the MCP server is configured.

  3. Register the MCP server (see examples/codex-setup.md or
     examples/claude-code-setup.md).

  4. Inspect memory any time:

       AGENT_MEMORY_DIR=$ROOT node $REPO/cli/agent-memory.js list
       AGENT_MEMORY_DIR=$ROOT node $REPO/cli/agent-memory.js search "term"
EOF
