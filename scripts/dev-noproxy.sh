#!/usr/bin/env bash
# Escape hatch: run the host + every external on raw localhost ports — no
# portless, no HTTPS, no *.localhost subdomains, no worktree namespacing.
#
# Use this when portless isn't installed or isn't working on your machine.
# Trade-offs (vs `bun run dev`):
#   - Dashboard is at http://localhost:$HOST_PORT (default 3000), not
#     https://web-tools.localhost.
#   - Externals run at http://localhost:<port> (port from the toml's `port`
#     key). The dashboard's /external/<slug> landing page still links to
#     the `<sub>.web-tools.localhost` origin and will NOT click through;
#     hit externals directly at their raw port instead. Each external's
#     URL is printed at startup.
#   - Worktree branch namespacing is skipped. Run one checkout at a time
#     in this mode (or set HOST_PORT / external ports manually to avoid
#     collisions).

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST_PORT="${HOST_PORT:-3000}"

PIDS=()
cleanup() {
  trap - INT TERM EXIT
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
}
trap cleanup INT TERM EXIT

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
  local slug dir port dev_cmd cmd
  slug=$(basename "$toml" .toml)
  dir="apps/external/$slug"
  port=$(toml_get "$toml" port)
  dev_cmd=$(toml_get "$toml" dev)
  if [ -z "$port" ] || [ -z "$dev_cmd" ]; then
    echo "[dev:noproxy] skip $slug — $toml missing 'port' or 'dev'"
    return
  fi
  if [ ! -d "$ROOT/$dir" ] || [ -z "$(ls -A "$ROOT/$dir" 2>/dev/null)" ]; then
    echo "[dev:noproxy] init submodule $dir"
    ( cd "$ROOT" && git submodule update --init "$dir" && cd "$dir" && bun install ) || {
      echo "[dev:noproxy] skip $slug — submodule init failed"
      return
    }
  fi
  cmd="${dev_cmd//\{PORT\}/$port}"
  echo "[dev:noproxy] $slug → http://localhost:$port"
  (
    cd "$ROOT/$dir"
    bash -c "$cmd"
  ) &
  PIDS+=($!)
}

echo "[dev:noproxy] host → http://localhost:$HOST_PORT"
(
  cd "$ROOT/apps/host"
  PORT="$HOST_PORT" bun run dev:raw
) &
PIDS+=($!)

shopt -s nullglob
for toml in "$ROOT/scripts/externals/"*.toml; do
  start_external "$toml"
done
shopt -u nullglob

wait
