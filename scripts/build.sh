#!/usr/bin/env bash
# Production build wrapper.
#
# Runs the shared DB preflight in STRICT mode (any drift or missing
# state → fail fast) before invoking `next build`, so we don't ship a
# build whose schema disagrees with the applied migrations. Also catches
# "deploy.sh forgot to run db:migrate" as a build-time failure rather
# than a runtime 500.
#
# Skip the preflight with SKIP_DB_CHECK=1.

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

STRICT=1 bash "$ROOT/scripts/db-preflight.sh" "[build]"

exec bun run --filter @web-tools/host build
