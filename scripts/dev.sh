#!/usr/bin/env bash
# Start the host + every external in parallel through portless.
#
# Worktree detection: if .git is a file (not a directory) we're in a worktree
# created by `wt switch --create`. In that case we skip externals — they're
# singletons that stay running in the main checkout to avoid URL collisions.
#
# To add an external: append a line to scripts/externals.sh.

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=externals.sh
source "$ROOT/scripts/externals.sh"

PIDS=()

cleanup() {
  trap - INT TERM EXIT
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
}
trap cleanup INT TERM EXIT

start() {
  local dir="$1"
  local name="$2"
  local app_port="$3"
  if [ ! -d "$ROOT/$dir" ]; then
    echo "[dev] skip $name — $dir not present (run \`git submodule update --init\`)"
    return
  fi
  (
    cd "$ROOT/$dir"
    portless --name "$name" --app-port "$app_port" bun run dev
  ) &
  PIDS+=($!)
}

# Host always runs. `portless run --name web-tools` auto-prefixes <wt>. in worktrees.
( cd "$ROOT" && bun run --filter @web-tools/host dev ) &
PIDS+=($!)

# Externals — main checkout only.
if [ -f "$ROOT/.git" ]; then
  echo "[dev] worktree detected — host only (externals stay singleton in main checkout)"
else
  for entry in "${EXTERNALS[@]}"; do
    read -r dir name port <<<"$entry"
    start "$dir" "$name" "$port"
  done
fi

wait
