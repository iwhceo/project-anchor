#!/usr/bin/env bash
set -e
if ! command -v node >/dev/null 2>&1; then
  echo "Node 20 or later is required. Install from https://nodejs.org."
  exit 1
fi
NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "Node 20 or later is required. Current: $(node -v)"
  exit 1
fi
exec npx --yes project-anchor@latest install "$@"
