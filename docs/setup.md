# Setup

## Prerequisites

- **[bun](https://bun.sh)** ≥ 1.2 — package manager + script runner.
  Install: `curl -fsSL https://bun.sh/install | bash`
- **[portless](https://github.com/vercel-labs/portless)** — local dev proxy that
  hands every dev server a stable `*.localhost` URL over HTTPS. Eliminates port
  collisions and gives worktree branches their own subdomain automatically.
  Install: `npm i -g portless`. Docs: [portless.sh](https://portless.sh).
- **[worktrunk](https://github.com/max-sixty/worktrunk)** (`wt`) — git worktree
  CLI with lifecycle hooks. We use it for branch worktrees with auto-install +
  typecheck/build hooks (see [`.wt.toml`](../.wt.toml)).
  Install: see the [worktrunk repo](https://github.com/max-sixty/worktrunk).

## First-time portless

```bash
portless trust            # add local CA to system trust store (once per machine)
portless proxy start      # start the HTTPS proxy daemon (auto-starts on first use)
portless hosts sync       # add /etc/hosts entries (only needed for Safari)
```

After this, any subdomain of `.localhost` resolves to the proxy with a real
TLS cert.

## Install + run

```bash
git submodule update --init --recursive   # if cloning fresh
bun install                                # workspaces (apps/host, packages/*)
( cd apps/external/r3f-examples && bun install )   # each external is independent
bun run dev                                # host + every external
```

External submodules are **not** bun workspaces — they have their own
`package.json` and lockfile. Install them once after `git submodule update`,
or whenever the submodule's `package.json` changes.

`bun run dev` runs `scripts/dev.sh`, which starts the host plus each
registered external with the right portless flags. It auto-detects
worktrees and skips externals there (they're singletons that stay running
in the main checkout — keeps URLs from colliding).

## Common scripts

| Command | What it does |
|---|---|
| `bun run dev` | Host + every external. In a worktree: host only. |
| `bun run dev:host` | Host only — explicit override, useful when an external is misbehaving. |
| `bun run build` | Production build of the host. |
| `bun run typecheck` | `tsc --noEmit` across all four workspaces. |
| `bun run check` | typecheck (alias). |
| `bun run clean` | Remove `node_modules` and `.next/` everywhere. |

## Worktrees

```bash
wt switch --create <branch>   # creates worktree, runs `bun install` in it
wt list                       # show all worktrees
wt remove                     # remove current worktree (and branch if merged)
```

URLs in a worktree:

| Surface | URL |
|---|---|
| Dashboard | `https://<branch>.web-tools.localhost/` |
| Built-in tool | `https://<branch>.web-tools.localhost/<slug>` |
| External tool | `https://<subdomain>.web-tools.localhost/` (singleton — same as main) |

External cards in a worktree-host dashboard link to the **main** external
URL. If you need a worktree-scoped external instance for testing, start it
manually from the submodule directory:

```bash
cd apps/external/<slug>
portless --name <branch>.<subdomain>.web-tools --app-port <port> bun run dev
```

## Troubleshooting

### "couldn't find next/package.json"

`bunfig.toml` must have `linker = "hoisted"`. If you suspect a broken install:

```bash
rm -rf node_modules apps/*/node_modules packages/*/node_modules bun.lock
bun install
```

`node_modules/next/` should exist at the **repo root** after install.

### External URL doesn't route under `bun run dev`

Confirm portless got the right `--app-port`. Each external in
`scripts/dev.sh` is started with an explicit `--app-port` because
portless's auto-port-detection doesn't recognize `bun run dev`. If you add
a new external, add its actual port to the script.

If you're in a worktree, externals are intentionally skipped — the script
prints `[dev] worktree detected — host only`. The main checkout's
external instance still serves the worktree-host dashboard's card.

### HTTPS warning in browser

Run `portless trust` once. If you reset your trust store, run it again.

### Subdomain doesn't resolve in Safari

Run `portless hosts sync` to add explicit `/etc/hosts` entries.
