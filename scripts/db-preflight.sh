#!/usr/bin/env bash
# Shared DB pre-flight check, used by dev + build.
#
# Surfaces host DB state before launching dev or building for prod, so
# devs / CI don't get cryptic Prisma errors deeper in the pipeline.
# Defers to Prisma's own `migrate status` output rather than parsing —
# onboarding-friendly (real Prisma messages, not bash-massaged ones).
#
# Usage:
#   bash scripts/db-preflight.sh <label>
#     <label>  prefix for log lines, e.g. [dev], [dev:noproxy], [build]
#
# Env flags:
#   STRICT=1          → on any non-OK state, exit 1 (build / deploy mode)
#   SKIP_DB_CHECK=1   → skip the check entirely
#
# Behavior matrix:
#                          | non-STRICT (dev)        | STRICT (build)
#   .env missing           | warn, continue          | warn, exit 1
#   DB file missing        | auto-init via db:migrate| warn, exit 1
#   db:status exit 0       | silent                  | silent
#   db:status non-zero     | warn + Prisma msg       | warn + Prisma msg, exit 1

set -eo pipefail

LABEL="${1:-[db]}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

[ "${SKIP_DB_CHECK:-}" = "1" ] && exit 0
[ -f "$ROOT/apps/host/prisma/schema.prisma" ] || exit 0

YELLOW='\033[33m'
NC='\033[0m'

if [ ! -f "$ROOT/apps/host/.env" ]; then
  echo -e "${YELLOW}${LABEL} apps/host/.env missing — Prisma will fail. Run:${NC}"
  echo "       cp apps/host/.env.example apps/host/.env && bun run db:migrate"
  [ "${STRICT:-}" = "1" ] && exit 1
  exit 0
fi

if [ ! -f "$ROOT/apps/host/.data/todo.db" ]; then
  if [ "${STRICT:-}" = "1" ]; then
    echo -e "${YELLOW}${LABEL} host DB missing — refusing to auto-init in strict mode.${NC}"
    echo "       run \`bun run db:migrate\` first, or unset STRICT."
    exit 1
  fi
  echo "${LABEL} fresh clone — initializing host DB…"
  ( cd "$ROOT" && bun run db:migrate )
  exit 0
fi

if ! status_out=$(cd "$ROOT" && bun run db:status 2>&1); then
  echo -e "${YELLOW}${LABEL} DB drift detected:${NC}"
  echo "$status_out" | sed 's/^/  /'
  echo -e "${YELLOW}       → bun run db:migrate  (apply pending)${NC}"
  echo -e "${YELLOW}       → bun run db:reset    (rebuild from scratch — destroys data)${NC}"
  [ "${STRICT:-}" = "1" ] && exit 1
fi

exit 0
