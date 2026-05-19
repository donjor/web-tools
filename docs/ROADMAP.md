# Roadmap

Forward-looking work. For shipped history see [CHANGELOG.md](CHANGELOG.md).

## Planned

### With spec

- [ ] [Todo: SQLite + Prisma backend, multi-list](roadmap/todo-sqlite-prisma.md) — first colleague-facing issue.

### Open invitations (no spec — pick what fits you)

- [ ] **Add a new built-in tool.** Any small browser tool that earns a card on the dashboard. Follows `/calculator` and `/todo`. See [adding-tools.md → Built-in tool](adding-tools.md#built-in-tool).
- [ ] **Add a new external tool.** Bring a Vite / Astro / Next / whatever app you've built (or want to), wire it as a submodule. Follows the r3f-examples pattern. See [adding-tools.md → External tool](adding-tools.md#external-tool).

### Tooling / hygiene

- [ ] ESLint setup — Next 16 removed `next lint`; needs an `eslint.config.mjs` + `eslint-config-next`.
- [ ] LICENSE decision — repo is currently "all rights reserved" by default.

## Parked (no spec, may or may not happen)

- SQLite → Postgres once the multi-list todo ships and a real DB box exists.
- CI: typecheck + build on PR (likely Github Actions).

## Conventions

- One row per discrete piece of work. Keep descriptions to one or two sentences here; deep specs go in [`roadmap/`](roadmap/).
- "With spec" = there's a written brief, the work is well-scoped, a contributor could pick it up cold.
- "Open invitations" = no spec, decisions are deliberately left open. Pick one, drop a note in an issue describing what you'd build, get a thumbs-up, then PR.
- "Tooling / hygiene" = small repo-health tasks; spec is "do the obvious thing".
- "Parked" = idea exists, not committed to. May get promoted to Planned, may stay parked forever.
- When something ships, move it to [CHANGELOG.md](CHANGELOG.md) under the version that carried it.
