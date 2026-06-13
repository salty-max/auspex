import { bakeCatalogue, openDataDb } from '@auspex/data'
import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { migrate } from 'drizzle-orm/postgres-js/migrator'

import { createApp } from '../src/app'
import { type Auth, createAuth } from '../src/auth/auth'
import { betterAuthProvider } from '../src/auth/provider'
import { connectPostgres, type PostgresConnection } from '../src/db/client'
import { drizzleListRepository } from '../src/lists/repository'

const url = process.env.DATABASE_URL
const describeIf = url ? describe : describe.skip

const xml = await Bun.file(
  new URL('fixtures/mini.cat', import.meta.url).pathname
).text()

describeIf('auth integration — BetterAuth flow', () => {
  let connection: PostgresConnection
  let auth: Auth
  let app: ReturnType<typeof createApp>

  beforeAll(async () => {
    connection = connectPostgres(url as string)
    await migrate(connection.db, {
      migrationsFolder: new URL('../drizzle', import.meta.url).pathname,
    })
    await connection.client`DELETE FROM lists`
    await connection.client`DELETE FROM session`
    await connection.client`DELETE FROM account`
    await connection.client`DELETE FROM "user"`

    const data = openDataDb(':memory:')
    bakeCatalogue(data, { xml })
    auth = createAuth(connection.db)
    app = createApp({
      db: data,
      lists: drizzleListRepository(connection.db),
      auth: betterAuthProvider(auth),
    })
  })

  afterAll(async () => {
    await connection.client.end()
  })

  /** Sign a user up and return their session cookie. */
  async function signUp(email: string): Promise<string> {
    const res = await auth.api.signUpEmail({
      body: { email, password: 'password123', name: email },
      asResponse: true,
    })
    const setCookie = res.headers.get('set-cookie')
    if (!setCookie) throw new Error('no session cookie from sign-up')
    return setCookie.split(';')[0]
  }

  const sampleList = {
    name: 'My List',
    faction: 'Test Chapter',
    body: 'list "My List"\nfaction Test Chapter\n5x Test Squad * warlord',
  }

  function create(cookie: string, json: unknown) {
    return app.request('/lists', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify(json),
    })
  }

  test('an anonymous request to /lists is rejected', async () => {
    expect((await app.request('/lists')).status).toBe(401)
  })

  test('a signed-up user creates a list owned by them', async () => {
    const cookie = await signUp('owner@x.test')
    const res = await create(cookie, sampleList)
    expect(res.status).toBe(201)
    const body = (await res.json()) as { list: { owner: string } }
    // The owner is the real BetterAuth user id (not the email).
    expect(body.list.owner).not.toBe('owner@x.test')
    expect(body.list.owner).toBeTruthy()

    const mine = await app.request('/lists', { headers: { cookie } })
    const mineBody = (await mine.json()) as { lists: unknown[] }
    expect(mineBody.lists).toHaveLength(1)
  })

  test('a second user cannot see the first user’s lists', async () => {
    const alice = await signUp('alice2@x.test')
    await create(alice, sampleList)
    const bob = await signUp('bob2@x.test')

    const bobLists = await (
      await app.request('/lists', { headers: { cookie: bob } })
    ).json()
    expect((bobLists as { lists: unknown[] }).lists).toHaveLength(0)
  })
})
