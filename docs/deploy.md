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
- **DNS**: dashboard at `<prodHost>` (`tools.donjor.net`); externals flattened to `<sub>.donjor.net` so they sit at the 1-level-deep mark covered by Cloudflare Free Universal SSL. Each external = one CNAME under the apex. Old hosts in `urlConfig.prodHostRedirects` (`web-tools.donjor.net`, apex `donjor.net`) → 301 to `tools.donjor.net` via Cloudflare Bulk Redirects or Page Rules.
- **Routing** is by Host header in Caddy — one site block per origin. Adding a new external means one new block in Caddyfile, one new ingress entry in cloudflared, one new CNAME at Cloudflare.

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

1. **Repo:** add submodule, append a `tools.config.ts` entry, create `scripts/externals/<slug>.toml` with `port` + `dev` cmd. (Detail: [`adding-tools.md`](adding-tools.md).)
2. **Repo:** add a new PM2 app to `ecosystem.config.cjs` — next free port in the reserved range. Use the external's own `node_modules/.bin/<binary>` as the script (absolute path from the repo root).
3. **Cloudflare DNS:** one new proxied CNAME `<slug>.donjor.net → <tunnel>.cfargotunnel.com`.
4. **Tunnel:** add one ingress entry `hostname: <slug>.donjor.net` to `cloudflared/config.yml`, restart cloudflared.
5. **Edge:** add a new `http://<slug>.donjor.net { reverse_proxy <app-host>:<port> }` site block to Caddyfile, reload Caddy. **Exact diff lives in the private runbook.**
6. `web-tools deploy` on the app host.

> Why three edge edits per tool (not zero): Cloudflare Free Universal SSL only covers 1-level-deep wildcards. If you upgrade to Advanced Certificate Manager, you can switch to a wildcard `*.donjor.net` and collapse all three to zero touches forever — see the runbook for the migration path.

## Migrating prodHost (e.g. `web-tools.donjor.net` → `tools.donjor.net`)

When `urlConfig.prodHost` flips, the code-side change is `urls.config.ts` +
`docs/*` + a CHANGELOG entry. The edge-side change is:

1. **Cloudflare DNS**: add proxied CNAME for the new host
   (`tools.donjor.net → <tunnel>.cfargotunnel.com`).
2. **Tunnel**: add ingress entry `hostname: tools.donjor.net` to
   `cloudflared/config.yml`, restart cloudflared.
3. **Caddy**: add a new `http://tools.donjor.net { reverse_proxy <app-host>:3300 }`
   site block, reload Caddy.
4. **Redirects**: for each host in `urlConfig.prodHostRedirects`, add a
   Cloudflare Bulk Redirect: `<old host>/*` → `https://tools.donjor.net/$1`
   with status 301 and preserve path/query. (Bulk Redirects > Edit list >
   add row.) The apex `donjor.net` redirect must coexist with whatever
   CNAMEs you have for `<sub>.donjor.net` externals — the redirect rule
   matches the apex hostname only, not subdomains.
5. Once verified, the old `web-tools.donjor.net` Caddy block / tunnel
   ingress can be removed (the redirect handles incoming requests).

Exact diff lives in the private runbook.

## Why these choices

- **Cloudflare Tunnel + Caddy + PM2** matches the rest of the lab so there's one mental model, not three. The tunnel keeps the app host off the public internet entirely — only the edge proxy speaks to Cloudflare, only Caddy speaks to the apps.
- **Wildcard everything that can be wildcarded** at the DNS / tunnel layer. Per-tool changes stay in code + Caddy. That's the difference between "five-minute new-tool checklist" and "thirty-minute infra ticket".
- **Plain HTTP at the Caddy origin** instead of issuing a cert via DNS-01. The tunnel already provides the encrypted channel from the edge; double-encrypting between tunnel and Caddy on the same host buys nothing.
- **Split wrapper instead of deploy key.** Less ceremony for a two-person setup, and human-triggered deploys are fine when the team is two people in the same Slack. Easy to add a deploy key later if you want webhooks/cron.

## What's NOT in this doc

- The actual hostnames / IPs / tunnel UUID / Cloudflare token. Those live in `private/RUNBOOK.md` (gitignored).
- Backup / restore. Apps in this deployment are stateless — state lives in browser localStorage. If that changes, add a backup section.
- Observability. Currently just `pm2 logs` and `journalctl -u cloudflared`. If we add Grafana/Loki/etc. later, document there.
