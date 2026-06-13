import type { Context } from 'hono'

import { ApiError } from '../errors'
import { captureError } from '../observability'

/**
 * The global error handler. A thrown `ApiError` becomes its structured body and
 * status; anything else is an unexpected fault — reported to Sentry and returned
 * as an opaque 500, never leaking internals to the client.
 */
export function errorHandler(error: Error, c: Context): Response {
  if (error instanceof ApiError) {
    return c.json(error.body(), error.status)
  }
  captureError(error)
  return c.json(
    { error: { code: 'internal_error', message: 'Something went wrong.' } },
    500
  )
}
