import { openDataDb } from '@auspex/data'

import { createApp } from './app'
import { connectPostgres } from './db/client'
import { drizzleListRepository } from './lists/repository'
import { initObservability } from './observability'

initObservability()

const dbPath =
  process.env.AUSPEX_DB_PATH ??
  new URL('../../../packages/data/artifacts/auspex.sqlite', import.meta.url)
    .pathname

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run the API.')
}
const { db: listsDb } = connectPostgres(databaseUrl)

const app = createApp({
  db: openDataDb(dbPath),
  lists: drizzleListRepository(listsDb),
})

export default {
  port: Number(process.env.PORT ?? 3000),
  fetch: app.fetch,
}
