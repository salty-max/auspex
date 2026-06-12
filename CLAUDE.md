# CLAUDE.md

Internal conventions for AI agents working on this repo. The README is the
human-facing entry point and must never reference this file.

## What this is

A Warhammer 40,000 toolkit: exact combat math engine (`packages/engine`), with a
normalized data model, list DSL, BSData importer, API, and web UI planned. Monolith
with package boundaries — see the README for the layout and rationale.

## Toolchain

- **Bun** is the package manager, test runner, and bundler (version pinned in
  `packageManager`). **Turborepo** orchestrates tasks across workspaces.
- **TypeScript 6, strict**, shared base config in `tsconfig.base.json`. ESM only.
- **ESLint** (type-checked rules + JSDoc on `src`, lighter ruleset on `tests`) and
  **Prettier** (no semicolons, single quotes). Exported declarations carry prose doc
  comments — `@param`/`@returns` tags are not used.
- Linting runs **per package** through turbo (each workspace has a `lint` script,
  so only changed packages relint), but the flat config is **shared at the root** —
  ESLint resolves it upward. Package-specific rules (e.g. React for `apps/web`) are
  added as glob blocks in the root config, not as separate config files. The root
  config and `.prettierrc` are declared as turbo inputs of the `lint` task so
  editing them busts the cache.
- **Husky** hooks: pre-commit runs typecheck + lint-staged + tests; commit-msg runs
  commitlint.

```sh
bun install
bun run typecheck   # tsc over src AND tests in every package
bun test            # bun:test across all packages
bun run lint        # per-package via turbo, zero warnings (lint:fix to autofix)
bun run build       # bundles + emits declarations
bun run format      # prettier over the whole repo
```

Run typecheck, test, lint and build locally before every push — CI is the safety
net, not the iteration loop.

## Rules accuracy (the project's core invariant)

The engine must implement the **real** tabletop rules, not remembered
approximations.

- `docs/rules/` holds the implemented rules **verbatim** (quoted from official
  sources, with links) plus the engine's implementation status for each.
- Before implementing or changing any game mechanic: check `docs/rules/`; if the
  rule isn't documented there yet, look it up at the source, add it to the doc in
  the same PR, then implement against the quoted text.
- Source code never cites rule sections or documents — comments describe what the
  code does ("the net modifier is clamped to ±1"), not where the rule comes from.
  The mapping from rule text to code lives in `docs/rules/` only.
- Known gaps (overkill, melee-vs-ranged cover, weapon keywords) are listed in
  `docs/rules/` — keep that status current when closing one.

## Engine conventions (`packages/engine`)

- **Zero runtime dependencies**, isomorphic, browser-first ESM. Keep
  `sideEffects: false` true in practice (no module-level state).
- Everything is **exact probability**, never Monte Carlo: results are deterministic
  distributions (`Distribution` = probability mass over non-negative integers,
  index = value). New mechanics compose as distribution transformations.
- Rule mechanics live in `rules.ts` as small pure functions testable in isolation;
  `sequence.ts` only composes them.
- `tsconfig.json` builds `src` (declaration emit needs `rootDir: src`);
  `tsconfig.test.json` typechecks `src` + `tests`. The `typecheck` script must
  point at the test config so tests stay typechecked — Bun strips types without
  checking them.

## Testing

- `bun:test`, files in `tests/*.test.ts` mirroring `src/` module names.
- Assert against **hand-computed probabilities** (e.g. 10 bolter shots into a
  Marine = mean 10/9) with the derivation as a comment; verify distributions sum
  to 1 and edge cases (zero attacks, degenerate p) collapse to point masses.

## Git & PRs

- Conventional commits, in English, **scope required** (enforced by commitlint).
  Workspace scopes are auto-generated from `packages/` and `apps/` directories;
  `deps`, `tooling`, `ci`, `docs` and `meta` are hand-listed for everything else.
  Pick the type by what changed: `feat`/`fix` for engine behavior, `docs`, `test`,
  `ci`, `build`, `refactor` for the rest.
- No AI attribution: no `Co-Authored-By: Claude`, no "Generated with" footers, in
  commits or PR descriptions.
- Use `Closes #N` / `Fixes #N` in PR descriptions so issues auto-close.
- **Every PR gets a self-review before it is opened**, run as a loop: all four
  gates green → read every changed file line by line → check the conventions in
  this file → hygiene (no dead code, no leftover debug output). Fix everything
  found, then re-run the **whole** pass from the top. Only stop when a complete
  pass returns LGTM — zero findings. Green CI is the entry ticket to the review,
  never the review itself.
