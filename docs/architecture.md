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
scripts/dev.sh       # main-checkout dev orchestration
.wt.toml                 # worktrunk hooks
bunfig.toml              # linker = "hoisted" (required, see below)
```

There is no `portless.json` — it was vestigial. `scripts/dev.sh` is the
single source of truth for which apps to start in dev.

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
- Runs on its own dev server, registered in `scripts/dev.sh`.
- Owns its origin: `<subdomain>.<base>`. The dashboard links out; the host
  does not proxy or path-mount externals.

## URL model

Single rule: **externals are origins (subdomain), built-ins are paths.**
The environment determines the base.

| Surface | Main checkout | Worktree `<wt>` | Production |
|---|---|---|---|
| Dashboard | `https://web-tools.localhost/` | `https://<wt>.web-tools.localhost/` | `https://example.com/` |
| Built-in | `https://web-tools.localhost/<slug>` | `https://<wt>.web-tools.localhost/<slug>` | `https://example.com/<slug>` |
| External | `https://<subdomain>.web-tools.localhost/` | same as main (singleton — see below) | `https://<subdomain>.example.com/` |

Worktree behavior: portless auto-prefixes the host's name with the worktree
slug. The host's dev script uses `portless run --name web-tools next dev`
which produces that prefix. **Externals are singletons** across worktrees —
they keep running on the main URL while worktree-host dashboards link to
them. If you genuinely need a per-worktree external instance, start it
manually with `portless --name <wt>.<subdomain>.web-tools --app-port <N>
bun run dev` from the submodule.

The base swap (`web-tools.localhost` ↔ `example.com`) is centralized in
[`urls.config.ts`](../urls.config.ts) and applied by `toolUrl()` in
`packages/tool-kit/src/index.ts`.

## Tool registry contract

The discriminated union in `packages/tool-kit/src/index.ts`:

```ts
type ToolManifest =
  | { kind: "builtin";  slug; title; description; icon?; tags? }
  | { kind: "external"; slug; title; description; icon?; tags?;
      subdomain; repo? };
```

`subdomain` is the **identity** part of the external's URL — `r3f-examples`
becomes `r3f-examples.web-tools.localhost` in dev and `r3f-examples.example.com`
in prod. Don't store the full host; the base belongs to `urls.config.ts`.

`repo` is documentary — humans reading the registry can find the submodule
source. Code doesn't use it.

Adding a tool is always two steps: create the implementation, then register
it in `tools.config.ts`.

## Dev orchestration

```bash
bun run dev         # host + every external (worktrees auto-skip externals)
bun run dev:host    # host only — explicit override
```

`bun run dev` is `bash scripts/dev.sh`. The script:

- starts the host via the host workspace's `dev` (which is `portless run --name web-tools …` — picks up the worktree prefix automatically).
- starts each external in its own subshell with explicit `--name` and `--app-port` flags. Portless can't infer the port from `bun run dev` because the `bun` runner isn't in portless's auto-detect list — passing `--app-port` is required.
- detects worktrees via `[ -f .git ]` and skips the externals block when running there, because externals are singletons that stay running in the main checkout. The worktree-host's dashboard still links to those singleton URLs.
- traps `INT/TERM/EXIT` and kills children on Ctrl-C.

If an external is misbehaving or you want a clean host-only run, use
`bun run dev:host`.

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
