# web-tools

A suite of browser-based tools. The root is a card-grid dashboard;
each card opens one tool.

**Live at:** [`tools.donjor.net`](https://tools.donjor.net) ·
externals run on `<subdomain>.donjor.net` (e.g.
[`r3f-examples.donjor.net`](https://r3f-examples.donjor.net)) but the
dashboard links via host-managed `/external/<slug>` landings so every
shared link carries proper unfurl metadata.

Two flavors of tools coexist:

- **Built-in** — Next.js routes inside `apps/host`. Share theme + dev server.
- **External** — git submodules under `apps/external/`. Any framework.
  Each gets its own portless subdomain.

Single source of truth for what's available: [`tools.config.ts`](tools.config.ts).

## Stack

bun workspaces · Next.js 16 (App Router, Turbopack) · React 19 ·
TypeScript strict · Tailwind v4 · shadcn/ui + Aceternity ·
portless · worktrunk.

## Quick start

```bash
git submodule update --init --recursive
bun install        # root + every external (postinstall installs submodules)
bun run dev        # host + every external (worktrees too, branch-namespaced)
bun run dev:host   # host only — explicit, useful when an external is misbehaving
```

First time on this machine? See [`docs/setup.md`](docs/setup.md) for the
`portless trust` step and other one-time setup.

## Repo layout

```
apps/
  host/                  # Next.js — dashboard + built-in tools
  external/              # git submodules (any stack)
packages/
  ui/                    # shadcn + Aceternity components
  tool-kit/              # ToolManifest type
  tailwind-preset/       # Tailwind v4 theme
tools.config.ts          # tool registry
urls.config.ts           # dev/prod URL bases
scripts/                 # externals/<slug>.toml registry + dev.sh + postinstall.sh
.wt.toml                 # worktrunk hooks
```

## Adding a tool

```ts
// tools.config.ts
{
  slug: "my-tool",
  title: "My Tool",
  description: "...",
  icon: "Wrench",
  kind: "builtin",          // or "external" + subdomain
}
```

Then create `apps/host/app/my-tool/page.tsx` (built-in) — or
`git submodule add … apps/external/my-tool` plus a `scripts/externals/my-tool.toml`
declaring its port and dev command (external).

Full recipe: [`docs/adding-tools.md`](docs/adding-tools.md).

## Documentation

| Doc | Description |
|---|---|
| [`docs/architecture.md`](docs/architecture.md) | How host, packages, and externals fit together; URL strategy. |
| [`docs/setup.md`](docs/setup.md) | First-time setup, common scripts, troubleshooting. |
| [`docs/adding-tools.md`](docs/adding-tools.md) | Recipes for built-in and external tools. |
| [`apps/external/README.md`](apps/external/README.md) | External submodule conventions. |

## Tools used

- **[portless](https://github.com/vercel-labs/portless)** ([portless.sh](https://portless.sh)) — local dev proxy that gives every dev server a stable `*.localhost` URL over HTTPS. We use it to route the host and each external onto named subdomains. Worktrees get an auto-prefix (`<branch>.web-tools.localhost`).
- **[worktrunk](https://github.com/max-sixty/worktrunk)** (`wt`) — git worktree CLI with hooks. We use it to spin up branch worktrees with `bun install` + typecheck/build hooks wired up via `.wt.toml`.
