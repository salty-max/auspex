# @auspex/api

The Auspex backend (Hono on Bun). It serves the baked faction data read-only and
persists army lists in Postgres, re-resolving each list's DSL on read. Authentication
lands next.

## Run

```sh
docker compose up -d         # local Postgres
export DATABASE_URL=postgres://auspex:auspex@localhost:5432/auspex
bun run db:migrate           # apply migrations
bun run dev                  # hot-reloading dev server
```

Configuration via environment:

| Variable         | Default                                 | Purpose                          |
| ---------------- | --------------------------------------- | -------------------------------- |
| `DATABASE_URL`   | _(required)_                            | Postgres connection (army lists) |
| `PORT`           | `3000`                                  | Listen port                      |
| `AUSPEX_DB_PATH` | `packages/data/artifacts/auspex.sqlite` | The baked data artifact          |
| `SENTRY_DSN`     | _(unset)_                               | Error reporting; off when unset  |

The data artifact is produced by `bun run bake` in `@auspex/data` (not committed).
List migrations live in `drizzle/`; `bun run db:generate` adds one after a schema
change.

## Endpoints

| Method | Path                                | Returns                |
| ------ | ----------------------------------- | ---------------------- |
| GET    | `/health`                           | Liveness               |
| GET    | `/factions`                         | All faction names      |
| GET    | `/factions/:faction/datasheets`     | Datasheets, filterable |
| GET    | `/factions/:faction/datasheets/:id` | One datasheet          |
| GET    | `/keywords`                         | Distinct keywords      |
| POST   | `/lists`                            | Create an army list    |
| GET    | `/lists`                            | List army lists        |
| GET    | `/lists/:id`                        | A list + resolved army |
| PATCH  | `/lists/:id`                        | Update a list          |
| DELETE | `/lists/:id`                        | Delete a list          |
| GET    | `/docs`                             | Scalar API reference   |
| GET    | `/openapi.json`                     | OpenAPI 3.1 spec       |

The datasheet list accepts `?keywords=A,B` (AND) and `?maxPoints=N`. A list stores
its DSL `body`; `GET /lists/:id` re-resolves it against the data into a costed army
with diagnostics. Errors return `{ error: { code, message } }`. Requests are
rate-limited per client.

The OpenAPI spec is generated from the route schemas, so it never drifts from the
code. Browse and try the endpoints live at `/docs`.

## Typed contract

The wire DTOs live in `src/contract.ts` as zod schemas plus inferred types, and the
app exports `AppType`. A consumer (the web app) gets end-to-end types with no
codegen via Hono RPC:

```ts
import { hc } from 'hono/client'
import type { AppType } from '@auspex/api/app'

const client = hc<AppType>('http://localhost:3000')
const res = await client.lists.$post({ json: { name, faction, body } })
```

The request and response types (`CreateListBody`, `GetListResponse`,
`DatasheetSummary`, …) can also be imported directly from `src/contract.ts`.
