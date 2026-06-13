import { createMiddleware } from 'hono/factory'

import { unauthorized } from '../errors'
import type { Auth } from './auth'

/**
 * Authentication, abstracted so the routes are testable. Production wraps
 * BetterAuth; tests inject a fixed user without a real session.
 */
export interface AuthProvider {
  /** Mounts the auth routes (sign-up/in/out/session); omitted in tests. */
  handler?: (request: Request) => Promise<Response>
  /** Resolve the authenticated user id from the request headers, if any. */
  getUserId(headers: Headers): Promise<string | undefined>
}

/** The auth provider backed by a real BetterAuth instance. */
export function betterAuthProvider(auth: Auth): AuthProvider {
  return {
    handler: (request) => auth.handler(request),
    async getUserId(headers) {
      const session = await auth.api.getSession({ headers })
      return session?.user.id
    },
  }
}

/** A fixed-user provider for tests; pass `undefined` to simulate no session. */
export function fakeAuthProvider(userId: string | undefined): AuthProvider {
  return {
    getUserId: () => Promise.resolve(userId),
  }
}

/** The variables a guarded route can read off the context. */
export interface AuthVariables {
  userId: string
}

/**
 * Require an authenticated user, setting `userId` on the context. Requests with
 * no session are rejected with a 401 before the handler runs.
 */
export function requireUser(provider: AuthProvider) {
  return createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
    const userId = await provider.getUserId(c.req.raw.headers)
    if (!userId) {
      throw unauthorized('Authentication required.')
    }
    c.set('userId', userId)
    await next()
  })
}
