import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from './schema'

/** A connected Drizzle database plus its underlying client, for shutdown. */
export interface PostgresConnection {
  db: PostgresJsDatabase<typeof schema>
  client: postgres.Sql
}

/** Connect to Postgres and wrap it with Drizzle and the list schema. */
export function connectPostgres(url: string): PostgresConnection {
  const client = postgres(url)
  return { db: drizzle(client, { schema }), client }
}

export type ListsDatabase = PostgresJsDatabase<typeof schema>
