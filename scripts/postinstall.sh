#!/usr/bin/env bash
# Runs automatically after `bun install` at the repo root.
# Installs deps for each external submodule discovered in scripts/externals/<slug>.toml,
# because external submodules are NOT bun workspaces (independent lockfiles).
#
# Slug = filename. Directory = apps/external/<slug>.
# Idempotent — bun no-ops when the lockfile and node_modules are up to date.
# Skips silently if a submodule directory isn't present (fresh clone without
# `git submodule update --init`).

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

shopt -s nullglob
for toml in "$ROOT/scripts/externals/"*.toml; do
  slug=$(basename "$toml" .toml)
  dir="apps/external/$slug"
  if [ ! -f "$ROOT/$dir/package.json" ]; then
    echo "[postinstall] skip $dir — not present (run \`git submodule update --init\` first)"
    continue
  fi
  echo "[postinstall] installing $dir"
  ( cd "$ROOT/$dir" && bun install )
done
shopt -u nullglob
