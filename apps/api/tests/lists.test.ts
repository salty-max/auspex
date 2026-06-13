import { bakeCatalogue, openDataDb } from '@auspex/data'
import { beforeEach, describe, expect, test } from 'bun:test'

import { createApp } from '../src/app'
import { inMemoryListRepository } from '../src/lists/repository'

const xml = await Bun.file(
  new URL('fixtures/mini.cat', import.meta.url).pathname
).text()

// The fixture has one datasheet: "Test Squad" (faction "Test Chapter", 5 models,
// 80 pts), with a "Test Bolt Rifle" weapon.
const dsl = `list "My List"
faction Test Chapter
5x Test Squad * warlord`

let app: ReturnType<typeof createApp>

beforeEach(() => {
  const db = openDataDb(':memory:')
  bakeCatalogue(db, { xml })
  app = createApp({ db, lists: inMemoryListRepository() })
})

async function post(path: string, json: unknown) {
  const res = await app.request(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(json),
  })
  return { status: res.status, body: await res.json() }
}

describe('POST /lists', () => {
  test('creates a list and returns it', async () => {
    const { status, body } = await post('/lists', {
      name: 'My List',
      faction: 'Test Chapter',
      body: dsl,
    })
    expect(status).toBe(201)
    const list = (body as { list: { id: string; name: string } }).list
    expect(list.id).toBeTruthy()
    expect(list.name).toBe('My List')
  })

  test('rejects a body missing required fields with a 400', async () => {
    const { status, body } = await post('/lists', { name: 'No faction' })
    expect(status).toBe(400)
    expect((body as { error: { code: string } }).error.code).toBe('bad_request')
  })
})

describe('GET /lists and /lists/:id', () => {
  test('lists are returned, and one resolves into a costed army', async () => {
    const created = await post('/lists', {
      name: 'My List',
      faction: 'Test Chapter',
      body: dsl,
    })
    const id = (created.body as { list: { id: string } }).list.id

    const all = await app.request('/lists')
    const allBody = (await all.json()) as { lists: unknown[] }
    expect(allBody.lists).toHaveLength(1)

    const res = await app.request(`/lists/${id}`)
    expect(res.status).toBe(200)
    const { resolved } = (await res.json()) as {
      resolved: {
        army: { totalPoints: number; units: { datasheetId: string }[] } | null
        diagnostics: unknown[]
      }
    }
    expect(resolved.army?.totalPoints).toBe(80)
    expect(resolved.army?.units[0]?.datasheetId).toBe('test-squad')
  })

  test('a list whose DSL references an unknown unit surfaces a diagnostic', async () => {
    const created = await post('/lists', {
      name: 'Bad',
      faction: 'Test Chapter',
      body: 'list "Bad"\nfaction Test Chapter\nImaginary Unit * warlord',
    })
    const id = (created.body as { list: { id: string } }).list.id
    const res = await app.request(`/lists/${id}`)
    const { resolved } = (await res.json()) as {
      resolved: { diagnostics: { severity: string; message: string }[] }
    }
    expect(resolved.diagnostics.some((d) => d.severity === 'error')).toBe(true)
  })

  test('an unknown id is a 404', async () => {
    const res = await app.request('/lists/00000000-0000-0000-0000-000000000000')
    expect(res.status).toBe(404)
  })
})

describe('PATCH and DELETE /lists/:id', () => {
  test('updates and deletes a list', async () => {
    const created = await post('/lists', {
      name: 'Original',
      faction: 'Test Chapter',
      body: dsl,
    })
    const id = (created.body as { list: { id: string } }).list.id

    const patched = await app.request(`/lists/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Renamed' }),
    })
    const patchedBody = (await patched.json()) as { list: { name: string } }
    expect(patchedBody.list.name).toBe('Renamed')

    const deleted = await app.request(`/lists/${id}`, { method: 'DELETE' })
    expect(deleted.status).toBe(204)
    expect((await app.request(`/lists/${id}`)).status).toBe(404)
  })
})
