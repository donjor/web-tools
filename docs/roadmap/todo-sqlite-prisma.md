# Todo: SQLite + Prisma backend, multi-list

## Context

`/todo` currently uses localStorage. We want real persistence and the
shape of a real app: **multiple named lists**, each with items, surviving
a dev server restart.

Long-term home is Postgres on a dedicated DB box. For now: **SQLite via
Prisma** so we get migrations + a schema that can swap to Postgres
config-only when the time comes.

## Scope

Entry: `https://web-tools.localhost/todo`

- Pick an existing list, or create one (named).
- Open a list → add / remove items.
- Delete a list (confirm first; items cascade out with it).
- Survive `bun run dev` restart.
- Old localStorage code removed, not left as a fallback.

## Constraints (the gates)

- SQLite + Prisma; schema in `apps/host/prisma/`, DB file at
  `apps/host/.data/todo.db` (path reserved, gitignored).
- `DATABASE_URL` env-driven. `.env.example` committed.
- Schema must work unchanged on Postgres — see
  [architecture → Data persistence](../architecture.md#data-persistence-built-in-tools)
  for the rules.
- API layer: Next 16 **Server Actions** + `revalidatePath` is the path
  of least resistance. (TanStack Query is out of scope for v1 — Server
  Actions handle invalidation.)
- `bun run typecheck` and `bun run build` clean.

## Open to taste

Routing (`/todo/[listId]` vs query param), list-selector UI, item
ordering, delete-confirm style, empty-state copy. Note your calls in
the PR description.

## Pointers

- `apps/host/app/todo/page.tsx` — current localStorage version
- `packages/ui/components/ui/` — shadcn primitives already wired up
- [`../architecture.md`](../architecture.md) — repo conventions + persistence rules
- `.dump/plans/001_2026-05-19_lxc-deploy/PLAN.md` — where the DB lives in prod (informs path choices)

## Submitting

You don't have push to this repo, so it's a fork + PR. Most of this is
clickable on github.com if you'd rather avoid the CLI:

1. **Fork** [`donjor/web-tools`](https://github.com/donjor/web-tools) via the *Fork* button (top-right).
2. **Clone your fork** and set it up:
   ```bash
   git clone <your-fork-url> && cd web-tools
   git submodule update --init --recursive
   bun install
   bun run dev   # sanity check
   ```
3. **Branch** — `feat/todo-sqlite-prisma` (or similar).
4. **Commit** focused chunks. Don't `--no-verify` the pre-commit hook.
5. **Push** to your fork.
6. **Open the PR** from your fork against `donjor/web-tools` `main` via
   github's *Compare & pull request* button, or `gh pr create --repo donjor/web-tools --base main`.
7. **PR description**: `Closes #N`, brief note on the design calls you
   made, confirm the gates above.

Keep scope to this issue — surface unrelated cleanups as separate
issues rather than expanding the PR.
