# Changelog

Shipped versions, newest first. Forward-looking work lives in
[ROADMAP.md](ROADMAP.md).

Format follows [Keep a Changelog](https://keepachangelog.com).
Versioning follows semver-ish: bump **MINOR** for features, **PATCH**
for fixes-only, **MAJOR** only on breaking external-facing changes.

---

## [Unreleased]

### Added
- **`bun run dev:noproxy`** — escape hatch that starts the host + every external on raw `localhost:<port>` (no portless, no HTTPS, no subdomains, no worktree namespacing). For contributors who can't or don't want to install portless. Host port is configurable via `$HOST_PORT` (default 3000); each external uses the raw `port` from its `scripts/externals/<slug>.toml`. The `/external/<slug>` landing's click-through doesn't work in this mode — hit externals at their printed `http://localhost:<port>` URL.

## [0.4.1] — 2026-05-19

### Added
- **3s auto-redirect on `/external/<slug>`** with a Cancel button — the landing page no longer requires a manual click to reach the external. The countdown still gives crawlers a moment to scrape the host-managed metadata and lets humans copy the URL or back out.

### Fixed
- **CSP on deployed externals** — `r3f-examples.donjor.net` was inheriting an onyxflix-tuned `(security-headers)` Caddy snippet whose `connect-src` only allowed `wss://onyxflix.net`, blocking the Cloudflare beacon, raw.githack.com HDR fetches, and most other third-party assets. Edge now imports a web-tools-specific `(web-tools-headers)` snippet (STS only). See `docs/deploy.md` for the snippet and `private/RUNBOOK.md` for the swap.

## [0.4.0] — 2026-05-19

### Added
- **Site metadata + OG share previews** for the dashboard and every built-in route (`/`, `/calculator`, `/todo`). `lib/metadata.ts` centralises helpers; `lib/og.tsx` renders 1200x630 branded cards (dark gradient + circular GitHub avatar).
- **Favicons** sourced from the user's GitHub avatar, masked to a clean circle with transparent corners — `app/icon.png` + `app/apple-icon.png`, auto-wired by Next App Router.
- **Site footer** in the root layout (sticky-bottom flex layout) with links to `/metadata-preview`, the source repo, and donjor's GitHub.
- **Host-managed external landings** at `/external/<slug>`. Externals still run on their own subdomains, but the dashboard links via these landings so shared URLs always carry host metadata (title, description, branded OG image). Click-through opens the real subdomain. New helpers: `createExternalMetadata`, `externalDirectUrl`.
- **`/metadata-preview`** dev-aid route showing each route's share card the way iMessage/Slack/Discord/Twitter will render it, plus a raw-meta panel.
- **`urlConfig.prodHostRedirects`** — source of truth for old hosts the edge should 301 to `prodHost`.

### Changed
- **`prodHost` renamed `web-tools.donjor.net` → `tools.donjor.net`**. Docs and `lib/metadata.ts` `SITE_URL` derive from `urlConfig.prodHost` (no more drift).
- **`toolUrl()` for externals** now returns `/external/<slug>` instead of the direct subdomain URL. The direct URL is available via the new `externalDirectUrl(t, ctx)` for the landing-page click-through.
- **Built-in tool pages split** into server wrapper + client component (`calculator-client.tsx`, `todo-client.tsx`) so the wrapper can export metadata.

### Migration note
The host rename needs edge changes: see `docs/deploy.md` → *Migrating prodHost* for the DNS / tunnel / Caddy / Cloudflare Bulk Redirects diff.

## [0.3.0] — 2026-05-19

### Added
- `scripts/externals/<slug>.toml` per-external registry. Each entry declares `port` and `dev` (with `{PORT}` substituted at launch) — the orchestrator is now framework-agnostic (vite, next, astro, anything that accepts a port flag).
- `WEB_TOOLS_WT_BRANCH` env var read by `toolUrl()` so worktree dashboards link to their own externals.

### Changed
- `bun run dev` now starts externals in worktrees too, namespaced as `<slug>.<branch>.web-tools.localhost` with a branch-deterministic port offset. Main checkout + any number of worktrees can run concurrently without portless route or vite port collisions.
- `scripts/dev.sh` auto-initialises missing submodules (`git submodule update --init` + `bun install`) so a fresh worktree boots straight from `bun run dev`.
- Docs (architecture / setup / adding-tools / deploy / `apps/external/README.md`) updated to the new registry contract.

### Removed
- `scripts/externals.sh` — replaced by the auto-discovered `scripts/externals/<slug>.toml` registry.

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
