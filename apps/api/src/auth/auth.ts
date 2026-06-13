import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'

import type { ListsDatabase } from '../db/client'
import * as authSchema from './schema'

/** Build the BetterAuth instance over the Postgres connection. */
export function createAuth(db: ListsDatabase) {
  return betterAuth({
    database: drizzleAdapter(db, { provider: 'pg', schema: authSchema }),
    emailAndPassword: { enabled: true },
    secret: process.env.BETTER_AUTH_SECRET ?? 'dev-secret-change-me',
    baseURL: process.env.AUTH_BASE_URL ?? 'http://localhost:3000',
  })
}

export type Auth = ReturnType<typeof createAuth>
