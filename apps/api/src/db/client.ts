import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as authSchema from '../auth/schema'
import * as listsSchema from './schema'

/** The full Drizzle schema: army lists plus the BetterAuth tables. */
export const schema = { ...listsSchema, ...authSchema }

/** A connected Drizzle database plus its underlying client, for shutdown. */
export interface PostgresConnection {
  db: PostgresJsDatabase<typeof schema>
  client: postgres.Sql
}

/** Connect to Postgres and wrap it with Drizzle and the full schema. */
export function connectPostgres(url: string): PostgresConnection {
  // Silence NOTICE chatter (e.g. "relation already exists, skipping" on a
  // re-run migration); real problems surface as errors, not notices.
  const client = postgres(url, { onnotice: () => undefined })
  return { db: drizzle(client, { schema }), client }
}

export type ListsDatabase = PostgresJsDatabase<typeof schema>
