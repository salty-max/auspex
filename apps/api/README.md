# @auspex/api

The Auspex backend (Hono on Bun). This first slice serves the baked faction data
read-only; Postgres-backed army lists and authentication land next.

## Run

```sh
bun run dev      # hot-reloading dev server
bun run start    # plain server
```

Configuration via environment:

| Variable         | Default                                 | Purpose                         |
| ---------------- | --------------------------------------- | ------------------------------- |
| `PORT`           | `3000`                                  | Listen port                     |
| `AUSPEX_DB_PATH` | `packages/data/artifacts/auspex.sqlite` | The baked data artifact         |
| `SENTRY_DSN`     | _(unset)_                               | Error reporting; off when unset |

The artifact is produced by `bun run bake` in `@auspex/data` and is not committed.

## Endpoints

| Method | Path                                | Returns                |
| ------ | ----------------------------------- | ---------------------- |
| GET    | `/health`                           | Liveness               |
| GET    | `/factions`                         | All faction names      |
| GET    | `/factions/:faction/datasheets`     | Datasheets, filterable |
| GET    | `/factions/:faction/datasheets/:id` | One datasheet          |
| GET    | `/keywords`                         | Distinct keywords      |

The datasheet list accepts `?keywords=A,B` (AND) and `?maxPoints=N`. Errors return
`{ error: { code, message } }`. Requests are rate-limited per client.
