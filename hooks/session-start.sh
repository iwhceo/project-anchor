#!/usr/bin/env bash
set -e
PROJECT_HASH=$(printf "%s" "$PWD" | shasum | cut -c1-8)
ANCHOR_DIR="$HOME/.claude/anchor/$PROJECT_HASH"
[ ! -d "$ANCHOR_DIR" ] && exit 0
DNA="$ANCHOR_DIR/PROJECT_DNA.md"
LAST=$(ls -t "$ANCHOR_DIR/sessions/"*.md 2>/dev/null | head -1)
echo "=== PROJECT ANCHOR memory loaded ==="
[ -f "$DNA" ] && cat "$DNA"
echo
echo "--- Last session ---"
[ -n "$LAST" ] && cat "$LAST"
