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
bun install                                # root workspaces + every external
bun run dev                                # host + every external
```

External submodules are **not** bun workspaces — they keep their own
`package.json` and lockfile. The root `postinstall` hook
(`scripts/postinstall.sh`) installs them automatically after every root
`bun install`, auto-discovering them from [`scripts/externals/`](../scripts/externals/)
(one `<slug>.toml` per external). Submodule dirs that aren't present are
skipped silently and re-initialised on demand by `bun run dev`.

`bun run dev` runs `scripts/dev.sh`, which starts the host plus each
external. Each external's toml declares its `port` and `dev` command
(with `{PORT}` substituted at launch). In a worktree the script namespaces
each external as `<slug>.<branch>.web-tools.localhost` with a
branch-deterministic port offset, so two checkouts can run side by side
without collisions.

## Common scripts

| Command | What it does |
|---|---|
| `bun run dev` | Host + every external. Worktrees: branch-namespaced. |
| `bun run dev:host` | Host only — explicit override, useful when an external is misbehaving. |
| `bun run dev:noproxy` | Escape hatch: host + every external on raw `localhost:<port>`. No portless / HTTPS / subdomains. See below. |
| `bun run build` | Production build of the host. |
| `bun run typecheck` | `tsc --noEmit` across all four workspaces. |
| `bun run check` | typecheck (alias). |
| `bun run clean` | Remove `node_modules` and `.next/` everywhere. |

## Running without portless (`dev:noproxy`)

For machines where portless isn't installed or isn't cooperating. Runs the
host and every external on raw localhost ports — no proxy, no HTTPS, no
`*.localhost` subdomains, no worktree namespacing.

```bash
bun run dev:noproxy            # host on :3000, externals on their toml port
HOST_PORT=4000 bun run dev:noproxy   # override host port
```

| Surface | URL |
|---|---|
| Dashboard | `http://localhost:3000/` |
| Built-in tool | `http://localhost:3000/<slug>` |
| External tool | `http://localhost:<port>/` (port from `scripts/externals/<slug>.toml`) |

Each external's URL is printed at startup.

Trade-offs vs `bun run dev`:

- The dashboard's **`/external/<slug>` landing page** composes the
  `<sub>.web-tools.localhost` origin and **will not click through** in this
  mode. Hit externals directly at their printed `http://localhost:<port>`
  URL instead.
- **One checkout at a time.** No branch namespacing — running two
  checkouts in this mode will fight over the same ports. Set `HOST_PORT`
  + edit toml ports manually if you really need two.
- No HTTPS — anything that requires a secure context (some Web APIs,
  service workers) won't work.

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
| External tool | `https://<subdomain>.<branch>.web-tools.localhost/` |

Each worktree gets its own external instances and the host's dashboard
links rewrite to match. Ports are offset by a branch-deterministic hash so
the main checkout and any number of worktrees can run concurrently.

## Troubleshooting

### "couldn't find next/package.json"

`bunfig.toml` must have `linker = "hoisted"`. If you suspect a broken install:

```bash
rm -rf node_modules apps/*/node_modules packages/*/node_modules bun.lock
bun install
```

`node_modules/next/` should exist at the **repo root** after install.

### External URL doesn't route under `bun run dev`

Confirm the `port` in `scripts/externals/<slug>.toml` matches what the
`dev` command actually opens — that port is what portless proxies to and
what gets substituted into `{PORT}`. If you added a new external and the
URL 502s or hangs, that's almost always the mismatch.

### HTTPS warning in browser

Run `portless trust` once. If you reset your trust store, run it again.

### Subdomain doesn't resolve in Safari

Run `portless hosts sync` to add explicit `/etc/hosts` entries.
