#!/usr/bin/env bash
# Start the host + every external in parallel through portless.
#
# Externals are auto-discovered from scripts/externals/<slug>.toml. Each toml
# declares `port` and `dev` (the launch command, with `{PORT}` substituted).
# The directory is conventional: apps/external/<slug>.
#
# Routing:
#   main checkout → <slug>.web-tools.localhost
#   worktree      → <slug>.<branch>.web-tools.localhost (port hash-offset so
#                   two checkouts can run side by side without collisions)
#
# The host always runs and gets WEB_TOOLS_WT_BRANCH so its tool-card URLs
# point at the worktree-namespaced external routes.

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

PIDS=()
cleanup() {
  trap - INT TERM EXIT
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
}
trap cleanup INT TERM EXIT

WT_BRANCH=""
if [ -f "$ROOT/.git" ]; then
  WT_BRANCH=$(git -C "$ROOT" rev-parse --abbrev-ref HEAD | tr '/' '-')
  export WEB_TOOLS_WT_BRANCH="$WT_BRANCH"
  echo "[dev] worktree '$WT_BRANCH' — externals namespaced as <slug>.$WT_BRANCH.web-tools.localhost"
fi

# Minimal TOML reader for `key = "value"` / `key = 1234`. No tables, no arrays.
toml_get() {
  awk -v k="$2" '
    $0 ~ "^[[:space:]]*"k"[[:space:]]*=" {
      sub(/^[^=]*=[[:space:]]*/, "")
      sub(/[[:space:]]*#.*$/, "")
      gsub(/^["'\'']|["'\'']$/, "")
      print; exit
    }
  ' "$1"
}

start_external() {
  local toml="$1"
  local slug dir name port dev_cmd cmd hash
  slug=$(basename "$toml" .toml)
  dir="apps/external/$slug"
  name="$slug.web-tools"
  port=$(toml_get "$toml" port)
  dev_cmd=$(toml_get "$toml" dev)
  if [ -z "$port" ] || [ -z "$dev_cmd" ]; then
    echo "[dev] skip $slug — $toml missing 'port' or 'dev'"
    return
  fi
  if [ ! -d "$ROOT/$dir" ] || [ -z "$(ls -A "$ROOT/$dir" 2>/dev/null)" ]; then
    echo "[dev] init submodule $dir"
    ( cd "$ROOT" && git submodule update --init "$dir" && cd "$dir" && bun install ) || {
      echo "[dev] skip $slug — submodule init failed"
      return
    }
  fi
  if [ -n "$WT_BRANCH" ]; then
    name="$slug.$WT_BRANCH.web-tools"
    hash=$(printf '%s' "$WT_BRANCH" | cksum | awk '{print $1}')
    port=$((port + 1000 + (hash % 1000)))
  fi
  cmd="${dev_cmd//\{PORT\}/$port}"
  (
    cd "$ROOT/$dir"
    portless --name "$name" --app-port "$port" bash -c "$cmd"
  ) &
  PIDS+=($!)
}

# Host always runs. `portless run --name web-tools` (in host's package.json)
# auto-prefixes <wt>. in worktrees, so the dashboard becomes
# <branch>.web-tools.localhost without any explicit branding here.
( cd "$ROOT" && bun run --filter @web-tools/host dev ) &
PIDS+=($!)

shopt -s nullglob
for toml in "$ROOT/scripts/externals/"*.toml; do
  start_external "$toml"
done
shopt -u nullglob

wait
