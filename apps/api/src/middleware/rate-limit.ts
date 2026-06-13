import type { MiddlewareHandler } from 'hono'

import { ApiError } from '../errors'

/** Rate-limit configuration. */
export interface RateLimitOptions {
  /** The window length in milliseconds. */
  windowMs: number
  /** The maximum requests one client may make per window. */
  max: number
}

/**
 * A fixed-window, per-client rate limiter. The store is in-memory, so it bounds a
 * single instance; a shared store (Redis) is needed once the API runs replicated.
 * The client key is the forwarded IP, falling back to a constant for local runs.
 */
export function rateLimit(options: RateLimitOptions): MiddlewareHandler {
  const hits = new Map<string, { count: number; resetAt: number }>()

  return async (c, next) => {
    const key =
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local'
    const now = Date.now()
    const entry = hits.get(key)

    if (!entry || now >= entry.resetAt) {
      hits.set(key, { count: 1, resetAt: now + options.windowMs })
    } else if (entry.count >= options.max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
      c.header('Retry-After', String(retryAfter))
      throw new ApiError(429, 'rate_limited', 'Too many requests.')
    } else {
      entry.count++
    }

    await next()
  }
}
