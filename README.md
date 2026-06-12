# auspex

A Warhammer 40,000 toolkit: an **exact combat math engine**, an **army builder**, and a
text **list DSL** — built around a single normalized data model.

> Rules target the **10th edition** for now. The data model is source-agnostic so it can be
> re-pointed at 11th edition once community data exists. The rules the engine implements
> are documented verbatim, with sources, in [docs/rules/](docs/rules/).

## Monorepo layout

```
packages/
  engine/   Exact probability engine for combat resolution (TS, zero-dependency, isomorphic)
  schema/   Normalized data model — datasheets, weapons, points (zod validators + engine converters)
  dsl/      Text list language + parser                                    (planned)
  importer/ BSData -> schema ingestion                                     (planned)
apps/
  api/      Backend: serves data, persists lists                          (planned)
  web/      Army builder + combat simulator UI                            (planned)
```

## Why a monolith, not microservices

The combat engine is a **pure library that runs in the browser** — clicking "simulate" must be
instant, with no network round-trip. Clean boundaries come from package boundaries, not from
splitting services; a service can always be extracted later if a real scaling need appears.

## Develop

```sh
bun install
bun test          # run every package's tests
bun run typecheck
bun run lint
```
