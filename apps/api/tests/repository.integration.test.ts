import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { migrate } from 'drizzle-orm/postgres-js/migrator'

import { user } from '../src/auth/schema'
import { connectPostgres, type PostgresConnection } from '../src/db/client'
import {
  drizzleListRepository,
  type ListRepository,
} from '../src/lists/repository'

// Runs only when a Postgres URL is configured (CI provides a service container;
// locally, `docker compose up` and export DATABASE_URL). Skipped otherwise.
const url = process.env.DATABASE_URL
const describeIf = url ? describe : describe.skip

describeIf('drizzleListRepository — Postgres integration', () => {
  let connection: PostgresConnection
  let repo: ListRepository

  beforeAll(async () => {
    connection = connectPostgres(url as string)
    await migrate(connection.db, {
      migrationsFolder: new URL('../drizzle', import.meta.url).pathname,
    })
    await connection.client`DELETE FROM lists`
    await connection.client`DELETE FROM "user"`
    // The owner FK requires real user rows.
    const now = new Date()
    await connection.db.insert(user).values([
      {
        id: 'alice',
        name: 'Alice',
        email: 'alice@x.test',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'bob',
        name: 'Bob',
        email: 'bob@x.test',
        createdAt: now,
        updatedAt: now,
      },
    ])
    repo = drizzleListRepository(connection.db)
  })

  afterAll(async () => {
    await connection.client.end()
  })

  test('create / get / list / update / remove round trip, scoped to owner', async () => {
    const created = await repo.create('alice', {
      name: 'Strike Force',
      faction: 'Space Marines',
      body: 'list "Strike Force"\nfaction Space Marines',
    })
    expect(created.owner).toBe('alice')
    expect(created.createdAt).toBeInstanceOf(Date)

    expect((await repo.get('alice', created.id))?.name).toBe('Strike Force')
    expect(await repo.list('alice')).toHaveLength(1)

    const updated = await repo.update('alice', created.id, { name: 'Renamed' })
    expect(updated?.name).toBe('Renamed')
    expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(
      created.updatedAt.getTime()
    )

    expect(await repo.remove('alice', created.id)).toBe(true)
    expect(await repo.get('alice', created.id)).toBeUndefined()
  })

  test('a different owner cannot see or mutate the list', async () => {
    const created = await repo.create('alice', {
      name: 'Alice only',
      faction: 'Space Marines',
      body: 'list "Alice only"\nfaction Space Marines',
    })
    expect(await repo.get('bob', created.id)).toBeUndefined()
    expect(await repo.list('bob')).toHaveLength(0)
    expect(
      await repo.update('bob', created.id, { name: 'Nope' })
    ).toBeUndefined()
    expect(await repo.remove('bob', created.id)).toBe(false)
    // Still there for alice.
    expect(await repo.get('alice', created.id)).toBeDefined()
  })
})
