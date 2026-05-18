# External tools

This directory holds external tools that are wired into the dashboard but
maintained as their own repositories. They are pulled in as **git submodules**
and can be any framework (Next.js, Vite, Astro, plain SPA, etc.).

The dashboard does **not** import code from external tools. It only links
out to the external's dev URL (or prod URL).

## URL model

Each external owns its origin:

- dev: `https://<subdomain>.web-tools.localhost/`
- prod: `https://<subdomain>.web-tools.donjor.net/` (configured in `urls.config.ts`)

Externals are **singletons across worktrees**. They keep running on the
main URL; worktree-host dashboards link to the same instance.

## Add a new external tool

```bash
# 1. Add the submodule
git submodule add <repo-url> apps/external/<slug>

# 2. Confirm its `dev` script binds to a known port — note the port number.
```

```ts
// 3. tools.config.ts — add an entry:
{
  slug: "<slug>",
  title: "<Title>",
  description: "<one-line description>",
  icon: "<LucideIconName>",
  kind: "external",
  subdomain: "<subdomain>",          // becomes <subdomain>.web-tools.localhost in dev
  repo: "<repo-url>",                // documentary
  tags: ["<optional>"],
}
```

```bash
# 4. Register the external in scripts/externals.sh by appending one line:
#
#   "apps/external/<slug> <subdomain>.web-tools <port>"
#
# Args: <directory> <portless-name> <app-port>.
# <port> must match what the submodule actually binds to.
# scripts/dev.sh (orchestrator) and scripts/postinstall.sh (deps installer)
# both read this file automatically.
```

```bash
# 5. From the repo root:
bun install           # root postinstall installs the submodule's deps too
bun run dev           # host + every external (worktrees auto-skip externals)
```

The external is now reachable at `https://<subdomain>.web-tools.localhost/`,
and the dashboard card opens it in a new tab.

## Conventions

- External submodules are **independent**. Their `package.json`, lockfile,
  and node_modules are theirs. No workspace linking required.
- Their `dev` script must bind to a fixed port — `scripts/dev.sh` tells
  portless that port via `--app-port`, because portless's auto-detection
  doesn't recognize `bun run dev`.
- If you want to share UI between the host and an external, copy the
  needed bits into the external — don't symlink across the submodule
  boundary.
- Each external should have its own README explaining how to develop it
  standalone (outside web-tools).
