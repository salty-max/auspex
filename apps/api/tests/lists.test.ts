import { bakeCatalogue, openDataDb } from '@auspex/data'
import { beforeEach, describe, expect, test } from 'bun:test'

import { createApp } from '../src/app'
import { fakeAuthProvider } from '../src/auth/provider'
import {
  inMemoryListRepository,
  type ListRepository,
} from '../src/lists/repository'

const xml = await Bun.file(
  new URL('fixtures/mini.cat', import.meta.url).pathname
).text()

const dsl = `list "My List"
faction Test Chapter
5x Test Squad * warlord`

let db: ReturnType<typeof openDataDb>
let lists: ListRepository

beforeEach(() => {
  db = openDataDb(':memory:')
  bakeCatalogue(db, { xml })
  lists = inMemoryListRepository()
})

/** An app authenticated as `userId` (or anonymous when `undefined`). */
function appAs(userId: string | undefined) {
  return createApp({ db, lists, auth: fakeAuthProvider(userId) })
}

async function postAs(userId: string, json: unknown) {
  const res = await appAs(userId).request('/lists', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(json),
  })
  return { status: res.status, body: await res.json() }
}

const sampleList = { name: 'My List', faction: 'Test Chapter', body: dsl }

describe('authentication', () => {
  test('list endpoints require a session', async () => {
    const anon = appAs(undefined)
    expect((await anon.request('/lists')).status).toBe(401)
    const post = await anon.request('/lists', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(sampleList),
    })
    expect(post.status).toBe(401)
  })
})

describe('POST /lists', () => {
  test('creates a list owned by the session user', async () => {
    const { status, body } = await postAs('alice', sampleList)
    expect(status).toBe(201)
    const list = (body as { list: { id: string; owner: string } }).list
    expect(list.id).toBeTruthy()
    expect(list.owner).toBe('alice')
  })

  test('rejects a body missing required fields with a 400', async () => {
    const { status, body } = await postAs('alice', { name: 'No faction' })
    expect(status).toBe(400)
    expect((body as { error: { code: string } }).error.code).toBe('bad_request')
  })
})

describe('list resolution and ownership', () => {
  test('a list resolves into a costed army for its owner', async () => {
    const created = await postAs('alice', sampleList)
    const id = (created.body as { list: { id: string } }).list.id

    const res = await appAs('alice').request(`/lists/${id}`)
    expect(res.status).toBe(200)
    const { resolved } = (await res.json()) as {
      resolved: {
        army: { totalPoints: number; units: { datasheetId: string }[] } | null
      }
    }
    expect(resolved.army?.totalPoints).toBe(80)
    expect(resolved.army?.units[0]?.datasheetId).toBe('test-squad')
  })

  test('a user only sees their own lists', async () => {
    await postAs('alice', sampleList)
    await postAs('bob', { ...sampleList, name: 'Bob list' })

    const aliceLists = await (await appAs('alice').request('/lists')).json()
    expect((aliceLists as { lists: unknown[] }).lists).toHaveLength(1)
    expect((aliceLists as { lists: { name: string }[] }).lists[0].name).toBe(
      'My List'
    )
  })

  test('another user cannot read, update or delete a list', async () => {
    const created = await postAs('alice', sampleList)
    const id = (created.body as { list: { id: string } }).list.id

    expect((await appAs('bob').request(`/lists/${id}`)).status).toBe(404)
    expect(
      (
        await appAs('bob').request(`/lists/${id}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ name: 'Hijacked' }),
        })
      ).status
    ).toBe(404)
    expect(
      (await appAs('bob').request(`/lists/${id}`, { method: 'DELETE' })).status
    ).toBe(404)
    // The list is untouched for its owner.
    expect((await appAs('alice').request(`/lists/${id}`)).status).toBe(200)
  })

  test('an unknown id is a 404', async () => {
    const res = await appAs('alice').request(
      '/lists/00000000-0000-0000-0000-000000000000'
    )
    expect(res.status).toBe(404)
  })
})

describe('PATCH and DELETE /lists/:id', () => {
  test('the owner updates and deletes their list', async () => {
    const created = await postAs('alice', sampleList)
    const id = (created.body as { list: { id: string } }).list.id

    const patched = await appAs('alice').request(`/lists/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Renamed' }),
    })
    const patchedBody = (await patched.json()) as { list: { name: string } }
    expect(patchedBody.list.name).toBe('Renamed')

    const deleted = await appAs('alice').request(`/lists/${id}`, {
      method: 'DELETE',
    })
    expect(deleted.status).toBe(204)
    expect((await appAs('alice').request(`/lists/${id}`)).status).toBe(404)
  })
})
