# Adding a tool

Every tool — built-in or external — is registered in `tools.config.ts` at
the repo root. That's the only place the dashboard looks. Pick the flavor
that fits.

## Built-in tool

Lives inside the host app. Shares its theme, components, and dev server.
Best for small/medium UIs that don't need their own backend or stack.

```bash
# 1. Create the route
mkdir -p apps/host/app/<slug>
```

```tsx
// apps/host/app/<slug>/page.tsx
"use client";
import { ToolFrame } from "@/components/tool-frame";
import { getBuiltin } from "@/lib/tools";

const manifest = getBuiltin("<slug>");

export default function Page() {
  return (
    <ToolFrame title={manifest?.title ?? "<Title>"} description={manifest?.description}>
      {/* your tool UI */}
    </ToolFrame>
  );
}
```

```ts
// tools.config.ts — add:
{
  slug: "<slug>",
  title: "<Title>",
  description: "<one-line description>",
  icon: "<LucideIconName>",
  kind: "builtin",
  tags: ["<optional>"],
}
```

```ts
// apps/host/lib/icons.ts — register the icon if not already mapped:
import { <LucideIconName> } from "lucide-react";
// add to the `map`:
<LucideIconName>,
```

Done. The dashboard renders a card automatically. The tool is reachable at
`https://web-tools.localhost/<slug>` (and `https://<wt>.web-tools.localhost/<slug>`
in a worktree).

## External tool

A git submodule under `apps/external/<slug>/`. Can be any framework. Runs
on its own dev server. The host doesn't import the code — it just links to
the external's URL.

```bash
# 1. Add the submodule
git submodule add <repo-url> apps/external/<slug>
```

Make sure the submodule's `package.json` has a working `dev` script that
binds to a known port.

```ts
// tools.config.ts — add:
{
  slug: "<slug>",
  title: "<Title>",
  description: "<one-line description>",
  icon: "<LucideIconName>",
  kind: "external",
  subdomain: "<subdomain>",        // dev: <subdomain>.web-tools.localhost
                                   // prod: <subdomain>.web-tools.donjor.net
  repo: "<repo-url>",              // documentary
  tags: ["<optional>"],
}
```

```bash
# 2. Register it in scripts/externals.sh by appending one line:
#
#   "apps/external/<slug> <subdomain>.web-tools <port>"
#
# Fields: <directory> <portless-name> <app-port>.
# <port> must match what the submodule's `dev` script actually listens on.
# Both scripts/dev.sh (orchestrator) and scripts/postinstall.sh (deps installer)
# read this list automatically.
```

```bash
# 3. Install everything (root + new external) and start.
bun install            # root postinstall installs the submodule's deps too
bun run dev            # host + every external (worktrees auto-skip externals)
```

The dashboard card opens `https://<subdomain>.web-tools.localhost/` in a
new tab.

## When to pick which

| Question | Lean built-in | Lean external |
|---|---|---|
| Will it share UI with other tools? | yes | no |
| Does it need a heavy framework choice (Vite, Astro, R3F, etc.)? | no | yes |
| Will it have its own server / database? | no | yes |
| Do you want its history in a separate git repo? | no | yes |
| Is it experimental / throwaway? | yes | no |

When in doubt, start built-in. Promoting a built-in to an external later is
cheap (extract the route folder into a new repo); demoting an external is
painful.
