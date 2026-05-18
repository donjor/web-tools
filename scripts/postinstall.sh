#!/usr/bin/env bash
# Runs automatically after `bun install` at the repo root.
# Installs deps for each external submodule listed in scripts/externals.sh,
# because external submodules are NOT bun workspaces (independent lockfiles).
#
# Idempotent — bun no-ops when the lockfile and node_modules are up to date.
# Skips silently if a submodule directory isn't present (fresh clone without
# `git submodule update --init`).

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=externals.sh
source "$ROOT/scripts/externals.sh"

for entry in "${EXTERNALS[@]}"; do
  read -r dir _name _port <<<"$entry"
  if [ ! -f "$ROOT/$dir/package.json" ]; then
    echo "[postinstall] skip $dir — not present (run \`git submodule update --init\` first)"
    continue
  fi
  echo "[postinstall] installing $dir"
  ( cd "$ROOT/$dir" && bun install )
done
