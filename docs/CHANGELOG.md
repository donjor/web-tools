# Changelog

Shipped versions, newest first. Forward-looking work lives in
[ROADMAP.md](ROADMAP.md).

Format follows [Keep a Changelog](https://keepachangelog.com).
Versioning follows semver-ish: bump **MINOR** for features, **PATCH**
for fixes-only, **MAJOR** only on breaking external-facing changes.

---

## [0.2.1] — 2026-05-19

### Fixed
- Skip `tsc` and cap NODE heap during deploy build on memory-constrained boxes (`293dc41`).
- Vite preview host-allowlist override for externals (`eda1b82`).

## [0.2.0] — 2026-05-19

### Added
- PM2 ecosystem config (`ecosystem.config.cjs`): host `:3300`, externals `:3301+`.
- `scripts/deploy.sh` — split-wrapper (humans run git/install/build under their SSH agent; `sudo -Hu webtools` runs only PM2 ops).
- `docs/deploy.md` — public architecture + ops contract. Host-specific runbook stays in gitignored `/private/`.

_Underlying plan: `.dump/plans/001_2026-05-19_lxc-deploy/`. Commit: `9cb0b0b`._

## [0.1.0] — 2026-05-19

Initial public release.

### Added — repo skeleton
- bun workspaces: `apps/host`, `apps/external/`, `packages/{ui,tool-kit,tailwind-preset}`.
- Next.js 16 (App Router + Turbopack) host at `apps/host`.
- Tailwind v4 theme + shadcn primitives + Aceternity `BackgroundBeams` in `packages/ui`.
- `tools.config.ts` registry; env-aware `toolUrl()` in `@web-tools/tool-kit`.

### Added — built-in tools
- Dashboard at `/` (card grid driven by `tools.config.ts`).
- `/calculator` — keyboard-driven four-function calculator.
- `/todo` — localStorage v1 (slated for replacement, see ROADMAP).

### Added — externals
- `r3f-examples` submodule (Vite, port 4444) at `apps/external/r3f-examples`.

### Added — dev workflow
- portless wiring: host auto-prefixes `<wt>.` in worktrees via `portless run --name web-tools`; externals are singletons across worktrees.
- `scripts/{externals,dev,postinstall}.sh` — single source of truth for external apps, used by both the dev orchestrator and the install hook.
- `bun install` at root auto-installs external submodules via root `postinstall` (`93ed469`).
- `.wt.toml` worktrunk hooks: `post-create` install, `pre-commit` typecheck, `pre-merge` build.

### Added — URL model
- dev: `web-tools.localhost` / `<subdomain>.web-tools.localhost`.
- prod: `web-tools.donjor.net` / `<subdomain>.web-tools.donjor.net` (`1e20d8d`).
- Base swap centralised in `urls.config.ts`.

_Initial commit: `2d7ccda`._

---

## Conventions

- One shipped change = one row under the relevant version, action-verb led.
- Group rows by **Added / Changed / Fixed / Removed**. Skip groups that don't apply.
- Bump `version` in root `package.json` when cutting a new version row.
- When a planned item from [ROADMAP.md](ROADMAP.md) ships, move it here and delete the corresponding ROADMAP row. Spec files in `roadmap/` stay (historical reference).
