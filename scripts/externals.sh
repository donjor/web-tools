# Source of truth for external apps wired into the dev workflow.
# Sourced by scripts/dev.sh (which uses all three fields) and
# scripts/postinstall.sh (which uses just the directory).
#
# Each entry: "<directory> <portless-name> <app-port>"
# - <directory>     path from repo root (e.g. apps/external/<slug>)
# - <portless-name> what shows up before `.localhost` (e.g. <slug>.web-tools)
# - <app-port>      the port the submodule's `bun run dev` actually binds to
#
# When adding an external, append one line here. Both dev.sh and postinstall.sh
# pick it up automatically.

EXTERNALS=(
  "apps/external/r3f-examples r3f-examples.web-tools 4444"
)
