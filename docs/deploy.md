# Deploying web-tools

How web-tools runs in production, and the day-to-day commands either collaborator uses.

> **Host-specific details** (IPs, hostnames, exact edge-proxy diffs) live outside this repo in a private runbook. This doc covers the architecture and ops contract — anyone reading the repo can understand the pattern without seeing the lab.

## Architecture

```
   Cloudflare edge
       │  TLS terminated here
       ▼
   Cloudflare Tunnel  (one shared tunnel for the whole lab)
       │  HTTP
       ▼
   Edge proxy host  ── Caddy
       │  HTTP, reverse-proxy by Host header
       ▼
   App host (LXC)  ── PM2 supervises one process per app
       ├─ web-tools-host           (Next.js, port 3300)
       ├─ web-tools-r3f-examples   (Vite preview, port 3301)
       └─ …                        (one port per external)
```

- **TLS** is terminated at the Cloudflare edge. The tunnel speaks HTTP, Caddy speaks HTTP, the apps speak HTTP. No origin-side certs anywhere.
- **DNS** is wildcard: `*.web-tools.donjor.net` (+ apex) both CNAME to the lab tunnel. Adding a new external never touches Cloudflare.
- **Routing** is by Host header in the single Caddy site block. Adding a new external means one new `@matcher` + `handle` pair in Caddyfile, nothing else at the edge.

## Ownership model — split wrapper

Two collaborators (`donjor`, `logworc`) deploy and operate the same instance. The setup:

- **Service user `webtools`** (system account, no login shell). Owns `/srv/web-tools` and is the canonical user PM2 runs as.
- **Shared group `webtools`** with both humans as members. `/srv/web-tools` is `chmod 2775` (setgid) so new files inherit the group; both humans set `umask 002` in their shells so created files stay group-writable.
- **Single `web-tools` CLI wrapper** in `/usr/local/bin/`. The deploy step runs **as the invoking human** (so GitHub auth via their forwarded SSH agent just works) and only the PM2 ops shell out to `sudo -Hu webtools` (so the supervisor daemon stays under one canonical user regardless of who triggered it).

That gives us:

- Either human can `git pull`/build/restart with no per-user PM2 daemon drift.
- File ownership stays sane via setgid + umask, not via a `chown` cron.
- The sudoers rule grants `NOPASSWD` for the `pm2` binary only — humans can't escalate further as `webtools`.

Tradeoff: every deploy needs a human at the keyboard (no cron / push-to-deploy yet). Add a deploy key on the `webtools` user later if you want unattended.

## Layout on the app host

```
/srv/web-tools/                       # owner: webtools:webtools, mode 2775
├── apps/host/                         # Next.js dashboard
├── apps/external/<slug>/              # each external — its own git submodule
├── packages/                          # shared workspaces
├── ecosystem.config.cjs               # PM2 manifest
├── scripts/deploy.sh                  # pull + install + build (as human) + pm2 reload (as webtools)
└── …
```

PM2 invokes app binaries directly from `node_modules/.bin/` — no `bun`/`bunx` at runtime, so the `webtools` user doesn't need a Bun install. The host's `next` binary is hoisted to monorepo-root `node_modules/.bin/` by Bun workspaces; each external has its own `node_modules/.bin/` (externals are not workspaces). Both run under system Node.

## Day-2 commands

Same wrapper, either collaborator, anywhere in the LXC:

| Command | What it does |
|---|---|
| `web-tools deploy` | `git pull --ff-only`, submodules, `bun install`, build host + each external, `pm2 startOrReload`, `pm2 save` |
| `web-tools restart` | `pm2 restart all` — no rebuild, just bounce the processes |
| `web-tools status` | `pm2 status` |
| `web-tools logs` | `pm2 logs` (all) |
| `web-tools logs <app>` | `pm2 logs <app>` (one app, e.g. `web-tools-host`) |

Direct git work (`cd /srv/web-tools && git fetch && …`) is fine — setgid + umask 002 keeps things group-writable.

## Adding a new external tool

1. **Repo:** add submodule, append a `tools.config.ts` entry, append a `start` line to `scripts/dev-all.sh`. (Detail: [`adding-tools.md`](adding-tools.md).)
2. **Repo:** add a new PM2 app to `ecosystem.config.cjs` — next free port in the reserved range. Use the external's own `node_modules/.bin/<binary>` as the script (absolute path from the repo root).
3. **Edge:** add one `@<slug> host <slug>.web-tools.donjor.net` + `handle @<slug> { reverse_proxy <app-host>:<port> }` pair inside the existing Caddy site block. Reload Caddy. **Exact diff lives in the private runbook.**
4. **Cloudflare:** nothing. The wildcard CNAME already covers any `<slug>.web-tools.donjor.net`.
5. **Tunnel:** nothing. The wildcard ingress already covers any `<slug>.web-tools.donjor.net`.
6. `web-tools deploy` on the app host.

## Why these choices

- **Cloudflare Tunnel + Caddy + PM2** matches the rest of the lab so there's one mental model, not three. The tunnel keeps the app host off the public internet entirely — only the edge proxy speaks to Cloudflare, only Caddy speaks to the apps.
- **Wildcard everything that can be wildcarded** at the DNS / tunnel layer. Per-tool changes stay in code + Caddy. That's the difference between "five-minute new-tool checklist" and "thirty-minute infra ticket".
- **Plain HTTP at the Caddy origin** instead of issuing a cert via DNS-01. The tunnel already provides the encrypted channel from the edge; double-encrypting between tunnel and Caddy on the same host buys nothing.
- **Split wrapper instead of deploy key.** Less ceremony for a two-person setup, and human-triggered deploys are fine when the team is two people in the same Slack. Easy to add a deploy key later if you want webhooks/cron.

## What's NOT in this doc

- The actual hostnames / IPs / tunnel UUID / Cloudflare token. Those live in `private/RUNBOOK.md` (gitignored).
- Backup / restore. Apps in this deployment are stateless — state lives in browser localStorage. If that changes, add a backup section.
- Observability. Currently just `pm2 logs` and `journalctl -u cloudflared`. If we add Grafana/Loki/etc. later, document there.
