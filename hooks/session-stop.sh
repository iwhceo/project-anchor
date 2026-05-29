#!/usr/bin/env bash
PROJECT_HASH=$(printf "%s" "$PWD" | shasum | cut -c1-8)
ANCHOR_DIR="$HOME/.claude/anchor/$PROJECT_HASH"
[ ! -d "$ANCHOR_DIR" ] && exit 0
[ -z "$CLAUDE_TRANSCRIPT_PATH" ] && exit 0
PA_BIN="$(command -v project-anchor || true)"
[ -z "$PA_BIN" ] && PA_BIN="npx project-anchor"
(nohup $PA_BIN compress --transcript "$CLAUDE_TRANSCRIPT_PATH" --cwd "$PWD" >/dev/null 2>&1 &) &
disown 2>/dev/null || true
exit 0
