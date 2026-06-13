import type { Database } from 'bun:sqlite'
import { Hono } from 'hono'

import { errorHandler } from './middleware/error'
import { rateLimit } from './middleware/rate-limit'
import { dataRoutes } from './routes/data'

/** The dependencies an app instance is built from. */
export interface AppDeps {
  /** An open handle to the baked data artifact. */
  db: Database
}

/**
 * Build the API. The data db is injected, so tests run the whole app against an
 * in-memory baked fixture without touching the filesystem.
 */
export function createApp(deps: AppDeps): Hono {
  const app = new Hono()

  app.use('*', rateLimit({ windowMs: 60_000, max: 120 }))
  app.get('/health', (c) => c.json({ status: 'ok' }))
  app.route('/', dataRoutes(deps.db))

  app.onError(errorHandler)
  return app
}
