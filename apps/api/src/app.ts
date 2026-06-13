import { OpenAPIHono } from '@hono/zod-openapi'
import { Scalar } from '@scalar/hono-api-reference'
import type { Database } from 'bun:sqlite'

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
 * in-memory baked fixture without touching the filesystem. The OpenAPI spec is
 * served at `/openapi.json` and the Scalar reference UI at `/docs`.
 */
export function createApp(deps: AppDeps): OpenAPIHono {
  const app = new OpenAPIHono()

  app.use('*', rateLimit({ windowMs: 60_000, max: 120 }))
  app.get('/health', (c) => c.json({ status: 'ok' }))
  app.route('/', dataRoutes(deps.db))

  app.doc('/openapi.json', {
    openapi: '3.1.0',
    info: { title: 'Auspex API', version: '0.0.0' },
  })
  app.get('/docs', Scalar({ url: '/openapi.json' }))

  app.onError(errorHandler)
  return app
}
