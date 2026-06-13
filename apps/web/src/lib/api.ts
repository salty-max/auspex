import type { AppType } from '@auspex/api/app'
import { hc } from 'hono/client'

/**
 * The typed API client. `AppType` comes from the server, so every path, param
 * and response shape is checked at compile time — no codegen, no drift. In dev,
 * Vite proxies these paths to the API (see `vite.config.ts`).
 */
export const api = hc<AppType>('/')
