import { connectPostgres } from '../db/client'
import { createAuth } from './auth'

/**
 * A concrete auth instance for the BetterAuth CLI (schema generation) to
 * introspect. The server builds its own instance in `index.ts` from the live
 * connection; this only exists so `bun run auth:generate` can read the config.
 */
const url =
  process.env.DATABASE_URL ?? 'postgres://auspex:auspex@localhost:5432/auspex'

export const auth = createAuth(connectPostgres(url).db)
