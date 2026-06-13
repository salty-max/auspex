import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { migrate } from 'drizzle-orm/postgres-js/migrator'

import { connectPostgres, type PostgresConnection } from '../src/db/client'
import {
  drizzleListRepository,
  type ListRepository,
} from '../src/lists/repository'

// Runs only when a Postgres URL is configured (CI provides a service container;
// locally, `docker compose up` and export DATABASE_URL). Skipped otherwise so the
// rest of the suite needs no database.
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
    repo = drizzleListRepository(connection.db)
  })

  afterAll(async () => {
    await connection.client.end()
  })

  test('create / get / list / update / remove round trip', async () => {
    const created = await repo.create({
      name: 'Strike Force',
      faction: 'Space Marines',
      body: 'list "Strike Force"\nfaction Space Marines',
    })
    expect(created.id).toBeTruthy()
    expect(created.createdAt).toBeInstanceOf(Date)

    const fetched = await repo.get(created.id)
    expect(fetched?.name).toBe('Strike Force')

    expect(await repo.list()).toHaveLength(1)

    const updated = await repo.update(created.id, { name: 'Renamed' })
    expect(updated?.name).toBe('Renamed')
    expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(
      created.updatedAt.getTime()
    )

    expect(await repo.remove(created.id)).toBe(true)
    expect(await repo.get(created.id)).toBeUndefined()
    expect(await repo.remove(created.id)).toBe(false)
  })
})
