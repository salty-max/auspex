import { OpenAPIHono } from '@hono/zod-openapi'
import { Scalar } from '@scalar/hono-api-reference'
import type { Database } from 'bun:sqlite'

import type { ListRepository } from './lists/repository'
import { errorHandler } from './middleware/error'
import { rateLimit } from './middleware/rate-limit'
import { dataRoutes } from './routes/data'
import { listRoutes } from './routes/lists'

/** The dependencies an app instance is built from. */
export interface AppDeps {
  /** An open handle to the baked data artifact. */
  db: Database
  /** Persistence for user army lists. */
  lists: ListRepository
}

/**
 * Build the API. The data db and list repository are injected, so tests run the
 * whole app against an in-memory baked fixture and list store without touching
 * Postgres or the filesystem. The routes are chained so the returned type carries
 * them — `AppType` drives a typed Hono RPC client for the web. The OpenAPI spec is
 * at `/openapi.json` and the Scalar reference UI at `/docs`.
 */
export function createApp(deps: AppDeps) {
  const app = new OpenAPIHono()
  app.use('*', rateLimit({ windowMs: 60_000, max: 120 }))

  const routed = app
    .get('/health', (c) => c.json({ status: 'ok' }))
    .route('/', dataRoutes(deps.db))
    .route('/', listRoutes({ lists: deps.lists, data: deps.db }))

  app.doc('/openapi.json', {
    openapi: '3.1.0',
    info: { title: 'Auspex API', version: '0.0.0' },
  })
  app.get('/docs', Scalar({ url: '/openapi.json' }))
  app.onError(errorHandler)

  return routed
}

/** The app's route type, for a typed Hono RPC client (`hc<AppType>`). */
export type AppType = ReturnType<typeof createApp>
