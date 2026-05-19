# Architecture

A monorepo whose root is a card-grid dashboard. Each card opens a "tool."
Tools come in two flavors that coexist by design.

## Workspace layout

```
apps/
  host/                  # Next.js 16 app — dashboard + built-in tools
  external/<slug>/       # git submodules — any framework, run on own port
packages/
  ui/                    # shadcn/ui + Aceternity, cn() helper
  tool-kit/              # ToolManifest type + toolUrl()
  tailwind-preset/       # Tailwind v4 theme tokens
tools.config.ts          # tool registry (source of truth)
urls.config.ts           # dev/prod URL bases
scripts/                 # externals/<slug>.toml registry + dev.sh + postinstall.sh
.wt.toml                 # worktrunk hooks
bunfig.toml              # linker = "hoisted" (required, see below)
```

There is no `portless.json` — it was vestigial. Externals are auto-discovered
from `scripts/externals/<slug>.toml`; that directory is the single source of
truth, consumed by `scripts/dev.sh` (orchestrator) and `scripts/postinstall.sh`
(deps installer). Each toml declares `port` and `dev` (the launch command,
with `{PORT}` substituted at start time).

## Tool flavors

### Built-in
- A Next.js route under `apps/host/app/<slug>/page.tsx`.
- Shares the host's React tree, theme, and dev server.
- **Canonically reachable at host paths** (`web-tools.localhost/<slug>`).
  No subdomain shortcut — that was deleted because it conflicts with
  worktree prefixes and `<slug>.<wt>.web-tools.localhost` is awkward.

### External
- A git submodule at `apps/external/<slug>/`.
- Can be any framework — Next, Vite, Astro, plain SPA.
- Runs on its own dev server, configured in `scripts/externals/<slug>.toml`.
- Owns its origin: `<subdomain>.<base>`. The dashboard links via a
  host-managed landing at `/external/<slug>` so shared URLs carry host
  metadata; the landing click-throughs to the real origin. Host doesn't
  proxy or path-mount the external's bytes.

## URL model

Two rules:

1. **Externals are origins** (subdomain) — they run on their own dev servers
   and own their own bytes.
2. **Built-ins are paths** under the host.

Plus one routing layer: the dashboard always links to externals via a
host-managed landing at `/external/<slug>`, so shared URLs carry host
metadata. The landing redirects-by-click onward to the external's real
origin.

| Surface | Main checkout | Worktree `<wt>` | Production |
|---|---|---|---|
| Dashboard | `https://web-tools.localhost/` | `https://<wt>.web-tools.localhost/` | `https://tools.donjor.net/` |
| Built-in | `https://web-tools.localhost/<slug>` | `https://<wt>.web-tools.localhost/<slug>` | `https://tools.donjor.net/<slug>` |
| External landing (shareable) | `https://web-tools.localhost/external/<slug>` | `https://<wt>.web-tools.localhost/external/<slug>` | `https://tools.donjor.net/external/<slug>` |
| External direct origin | `https://<subdomain>.web-tools.localhost/` | `https://<subdomain>.<wt>.web-tools.localhost/` | `https://<subdomain>.donjor.net/` |

Worktree behavior: portless auto-prefixes the host's name with the worktree
slug (the host's dev script uses `portless run --name web-tools next dev`).
`scripts/dev.sh` namespaces each external's portless route the same way —
`<sub>.<wt>.web-tools.localhost` — and offsets its port by a
branch-deterministic hash so the main checkout and any number of worktrees
can run concurrently without colliding. The host receives
`WEB_TOOLS_WT_BRANCH` and `externalDirectUrl()` derives each external's
real origin from it, so the host-managed `/external/<slug>` landing in a
worktree clicks through to that worktree's own external instance rather
than the main checkout's.

Bases live in [`urls.config.ts`](../urls.config.ts). `toolUrl()` returns
host-relative paths (`/<slug>` or `/external/<slug>`); the external
landing uses `externalDirectUrl()` to compose the actual origin URL from
the env-aware base for the click-through. Both live in
`packages/tool-kit/src/index.ts`.

- `devBase` — dashboard + external base in dev (`web-tools.localhost`).
- `prodHost` — dashboard host in prod (`tools.donjor.net`).
- `prodExternalBase` — external base in prod (`donjor.net`). Flatter than the dashboard host so Cloudflare Free Universal SSL covers `<sub>.donjor.net` automatically (it only covers 1-level wildcards).
- `prodHostRedirects` — old hosts the edge should 301 → `prodHost`. Currently `web-tools.donjor.net` and the apex `donjor.net`.

## Tool registry contract

The discriminated union in `packages/tool-kit/src/index.ts`:

```ts
type ToolManifest =
  | { kind: "builtin";  slug; title; description; icon?; tags? }
  | { kind: "external"; slug; title; description; icon?; tags?;
      subdomain; repo? };
```

`subdomain` is the **identity** part of the external's URL — `r3f-examples`
becomes `r3f-examples.web-tools.localhost` in dev and `r3f-examples.donjor.net`
in prod. Don't store the full host; the base belongs to `urls.config.ts`.

`repo` is documentary — humans reading the registry can find the submodule
source. Code doesn't use it.

Adding a tool is always two steps: create the implementation, then register
it in `tools.config.ts`.

## Dev orchestration

```bash
bun run dev         # host + every external (worktrees too, branch-namespaced)
bun run dev:host    # host only — explicit override
```

`bun run dev` is `bash scripts/dev.sh`. The script:

- starts the host via the host workspace's `dev` (which is `portless run --name web-tools …` — picks up the worktree prefix automatically).
- auto-discovers externals by globbing `scripts/externals/*.toml`. Each toml's `dev` command runs through portless with explicit `--name` and `--app-port` (portless can't infer the port from arbitrary launchers, so the toml's `port` is authoritative). The `{PORT}` placeholder in `dev` is substituted at launch, which is what makes the launcher framework-agnostic — vite, next, astro, anything that accepts a port flag.
- detects worktrees via `[ -f .git ]` and, in that mode, namespaces each external's portless route as `<slug>.<branch>.web-tools.localhost`, offsets the port by a branch-deterministic hash, and exports `WEB_TOOLS_WT_BRANCH` so the host's `externalDirectUrl()` (used by the `/external/<slug>` landing) clicks through to the worktree's external instance.
- auto-initialises missing submodules (`git submodule update --init` + `bun install`) so a fresh worktree boots straight from `bun run dev`.
- traps `INT/TERM/EXIT` and kills children on Ctrl-C.

If an external is misbehaving or you want a clean host-only run, use
`bun run dev:host`.

### Escape hatch: `dev:noproxy`

`bun run dev:noproxy` (`scripts/dev-noproxy.sh`) starts everything on raw
`localhost:<port>` — no portless, no HTTPS, no subdomains, no worktree
namespacing. Host runs the host workspace's `dev:raw` (plain
`next dev --turbopack`) on `$HOST_PORT` (default 3000); each external runs
its toml `dev` command directly on its declared `port`. Single checkout
only — there's no port offset, and the `/external/<slug>` landing won't
click through (it still composes `<sub>.web-tools.localhost`). For
contributors who can't or don't want to install portless.

## Data persistence (built-in tools)

Built-in tools that need to persist state use **SQLite via Prisma** in dev
and single-host prod. The intended migration path is Postgres on a
dedicated server once it's worth running one; the schema and code must
make that swap config-only.

### Where the data lives

- **Dev**: `apps/host/.data/<tool>.db` (gitignored except for the `.gitkeep`
  that reserves the directory).
- **Prod** (per [`.dump/plans/001_2026-05-19_lxc-deploy`](../.dump/plans/001_2026-05-19_lxc-deploy/PLAN.md)):
  a path under `/srv/web-tools/data/` writable by the `webtools` PM2 user.
  Pick paths that survive that ownership model.

### Postgres-portability rules

The schema MUST work unchanged when we swap Prisma's
`datasource.provider` from `sqlite` to `postgresql`. To keep that promise:

- No SQLite-only column types (`BLOB`, untyped `TEXT` storage class tricks).
- No SQLite-specific functions or expressions in default values.
- No virtual columns.
- No raw SQL access — go through Prisma client only.
- Foreign keys explicit; cascade behavior set in the schema.

A swap to Postgres will then be: change `provider`, point `DATABASE_URL`
at the Postgres instance, re-run migrations. No app code changes.

### Where Prisma artifacts live

Prisma is a host-level concern (only built-in tools touch it). Schema at
`apps/host/prisma/schema.prisma`, generated client at
`apps/host/prisma/generated/`, migrations at `apps/host/prisma/migrations/`.
If a second built-in tool needs the same DB, both share the host's Prisma
client (one `schema.prisma`, multiple model groups).

## Why hoisted (`bunfig.toml`)

bun's default install is "isolated" — workspace deps live in each package's
own `node_modules/`, with no root `node_modules/`. Turbopack's module
resolver can't traverse that layout from `apps/host/app/`, so the build
fails with "couldn't find next/package.json."

`bunfig.toml` pins `linker = "hoisted"`, which puts everything at the repo
root. `apps/host/next.config.ts` then sets `turbopack.root` and
`outputFileTracingRoot` to the repo root.

## Theme + UI

Tailwind v4 with `@import "tailwindcss"` and an `@theme` block. Tokens live
in `packages/tailwind-preset/globals.css`. The host's `app/globals.css`
re-imports it and adds `@source` directives so Tailwind scans the shared
`packages/ui/` components.

Components in `packages/ui/components/ui/` are shadcn primitives. Aceternity
components live alongside in `packages/ui/components/aceternity/`. Aceternity
is copy-paste, not a package.

## Worktrees

[`.wt.toml`](../.wt.toml) wires [worktrunk](https://github.com/max-sixty/worktrunk)
hooks:

- `post-create`: `bun install` inside the new worktree.
- `pre-commit`: `bun run typecheck`.
- `pre-merge`: `bun run build`.

[portless](https://github.com/vercel-labs/portless) auto-prefixes the host's
name with the worktree slug, and `allowedDevOrigins: ["*.web-tools.localhost"]`
in `apps/host/next.config.ts` allows HMR for the worktree-prefixed URL.
