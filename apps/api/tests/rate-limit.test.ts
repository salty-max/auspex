import { describe, expect, test } from 'bun:test'
import { Hono } from 'hono'

import { ApiError } from '../src/errors'
import { errorHandler } from '../src/middleware/error'
import { rateLimit } from '../src/middleware/rate-limit'

function appWith(max: number): Hono {
  const app = new Hono()
  app.use('*', rateLimit({ windowMs: 60_000, max }))
  app.get('/', (c) => c.text('ok'))
  app.onError(errorHandler)
  return app
}

describe('rate limiting', () => {
  test('allows up to the cap, then returns 429 with a structured body', async () => {
    const app = appWith(2)
    const headers = { 'x-forwarded-for': '10.0.0.1' }
    expect((await app.request('/', { headers })).status).toBe(200)
    expect((await app.request('/', { headers })).status).toBe(200)

    const limited = await app.request('/', { headers })
    expect(limited.status).toBe(429)
    expect(limited.headers.get('Retry-After')).not.toBeNull()
    expect(await limited.json()).toEqual({
      error: { code: 'rate_limited', message: 'Too many requests.' },
    })
  })

  test('limits are per client', async () => {
    const app = appWith(1)
    expect(
      (await app.request('/', { headers: { 'x-forwarded-for': '1.1.1.1' } }))
        .status
    ).toBe(200)
    // A different client is unaffected by the first client's usage.
    expect(
      (await app.request('/', { headers: { 'x-forwarded-for': '2.2.2.2' } }))
        .status
    ).toBe(200)
  })

  test('the error handler hides unexpected faults behind an opaque 500', async () => {
    const app = new Hono()
    app.get('/', () => {
      throw new Error('boom: secret internals')
    })
    app.onError(errorHandler)
    const res = await app.request('/')
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({
      error: { code: 'internal_error', message: 'Something went wrong.' },
    })
  })

  test('an ApiError surfaces its status and code', async () => {
    const app = new Hono()
    app.get('/', () => {
      throw new ApiError(403, 'forbidden', 'Nope.')
    })
    app.onError(errorHandler)
    const res = await app.request('/')
    expect(res.status).toBe(403)
    const body = (await res.json()) as { error: { code: string } }
    expect(body.error.code).toBe('forbidden')
  })
})
