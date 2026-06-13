# @auspex/web

The Auspex front-end — a React + Vite SPA. The combat engine runs **in the
browser** (no round-trip), and data/lists come from `@auspex/api` through a typed
client. The combat simulator (#17) and army builder (#18) build on this scaffold.

## Stack

- **React 19 + Vite** (SPA — the engine is client-side, no SSR needed)
- **Tailwind CSS v4 + shadcn/ui** (new-york, zinc, dark)
- **TanStack Query** for server state, over a typed **Hono RPC** client
  (`hc<AppType>`) — the API's `AppType` checks every call at compile time
- **`@auspex/engine`** imported directly and run in-browser

## Run

```sh
bun run dev        # Vite dev server on :5173 (proxies /api, /factions, … to :3000)
bun run build      # typecheck + production bundle
```

The dev server proxies API paths to `http://localhost:3000`, so run the API
(`apps/api`) alongside for live data; the engine demo works with no API.

## Layout

```
src/
  app.tsx            The current demo: engine-in-browser + a typed API query
  main.tsx           Entry — React root + TanStack Query provider
  lib/api.ts         The typed hc<AppType> client
  lib/utils.ts       cn() — shadcn class merge
  components/ui/     shadcn components
  index.css          Tailwind + the theme tokens
```
