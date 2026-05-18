#!/usr/bin/env bash
# web-tools deploy — split-wrapper model.
#
# Runs as the invoking human (donjor or logworc), uses their forwarded SSH
# agent for GitHub auth. Only the PM2 ops at the end shell out to
# `sudo -Hu webtools` so the supervisor daemon stays under one canonical user
# regardless of who triggered the deploy.
#
# Invoked via /usr/local/bin/web-tools (the thin wrapper installed on test).
# Run from anywhere — script always cd's into /srv/web-tools.
#
# Reads scripts/externals.sh for the external list. `bun install` triggers
# scripts/postinstall.sh which installs deps for every external listed there.

set -euo pipefail
umask 002    # belt-and-braces: keep files group-writable even from non-interactive shells

REPO=/srv/web-tools
cd "$REPO"

echo "▶ git pull (as $USER, using your forwarded SSH agent)"
git pull --ff-only
git submodule update --init --recursive

echo "▶ bun install (also runs scripts/postinstall.sh → installs every external)"
bun install

# shellcheck source=externals.sh
source "$REPO/scripts/externals.sh"

echo "▶ build each external (postinstall handled install)"
for entry in "${EXTERNALS[@]}"; do
  read -r dir _name _port <<<"$entry"
  [ -f "$REPO/$dir/package.json" ] || { echo "  · $dir — not present, skipped"; continue; }
  echo "  · $dir"
  ( cd "$REPO/$dir" && (bun run build || echo "    (no build script — skipped)") )
done

echo "▶ bun run build (host)"
bun run build

echo "▶ pm2 startOrReload (as webtools)"
sudo -Hu webtools pm2 startOrReload "$REPO/ecosystem.config.cjs"
sudo -Hu webtools pm2 save

echo "✓ deploy complete"
sudo -Hu webtools pm2 status
