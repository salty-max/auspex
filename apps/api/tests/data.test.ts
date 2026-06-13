import { bakeCatalogue, openDataDb } from '@auspex/data'
import { beforeAll, describe, expect, test } from 'bun:test'
import type { Hono } from 'hono'

import { createApp } from '../src/app'

const xml = await Bun.file(
  new URL('fixtures/mini.cat', import.meta.url).pathname
).text()

let app: Hono

beforeAll(() => {
  const db = openDataDb(':memory:')
  // The fixture's Test Squad: faction "Test Chapter", keywords ADEPTUS ASTARTES
  // + INFANTRY, 80 pts.
  bakeCatalogue(db, { xml })
  app = createApp({ db })
})

async function get(path: string): Promise<{ status: number; body: unknown }> {
  const res = await app.request(path)
  return { status: res.status, body: await res.json() }
}

describe('GET /health', () => {
  test('reports ok', async () => {
    expect(await get('/health')).toEqual({
      status: 200,
      body: { status: 'ok' },
    })
  })
})

describe('GET /factions', () => {
  test('lists the baked factions', async () => {
    expect(await get('/factions')).toEqual({
      status: 200,
      body: { factions: ['Test Chapter'] },
    })
  })
})

describe('GET /factions/:faction/datasheets', () => {
  test('returns the faction datasheets', async () => {
    const { status, body } = await get('/factions/Test Chapter/datasheets')
    expect(status).toBe(200)
    expect(body).toEqual({
      datasheets: [
        {
          faction: 'Test Chapter',
          id: 'test-squad',
          name: 'Test Squad',
          points: 80,
        },
      ],
    })
  })

  test('honours the keyword filter', async () => {
    const hit = await get('/factions/Test Chapter/datasheets?keywords=INFANTRY')
    expect((hit.body as { datasheets: unknown[] }).datasheets).toHaveLength(1)
    const miss = await get('/factions/Test Chapter/datasheets?keywords=VEHICLE')
    expect((miss.body as { datasheets: unknown[] }).datasheets).toEqual([])
  })

  test('honours the maxPoints filter', async () => {
    const miss = await get('/factions/Test Chapter/datasheets?maxPoints=50')
    expect((miss.body as { datasheets: unknown[] }).datasheets).toEqual([])
  })

  test('rejects a malformed query with a structured 400', async () => {
    const { status, body } = await get(
      '/factions/Test Chapter/datasheets?maxPoints=lots'
    )
    expect(status).toBe(400)
    expect(body).toEqual({
      error: { code: 'bad_request', message: 'Invalid query parameters.' },
    })
  })
})

describe('GET /factions/:faction/datasheets/:id', () => {
  test('returns one datasheet', async () => {
    const { status, body } = await get(
      '/factions/Test Chapter/datasheets/test-squad'
    )
    expect(status).toBe(200)
    expect((body as { datasheet: { name: string } }).datasheet.name).toBe(
      'Test Squad'
    )
  })

  test('unknown id is a structured 404', async () => {
    const { status, body } = await get(
      '/factions/Test Chapter/datasheets/missing'
    )
    expect(status).toBe(404)
    expect((body as { error: { code: string } }).error.code).toBe('not_found')
  })
})

describe('GET /keywords', () => {
  test('lists keywords, optionally scoped to a faction', async () => {
    expect(await get('/keywords')).toEqual({
      status: 200,
      body: { keywords: ['ADEPTUS ASTARTES', 'INFANTRY'] },
    })
    const empty = await get('/keywords?faction=Orks')
    expect(empty.body).toEqual({ keywords: [] })
  })
})
