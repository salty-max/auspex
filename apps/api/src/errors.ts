import type { ContentfulStatusCode } from 'hono/utils/http-status'

/** The JSON body returned for every error response. */
export interface ApiErrorBody {
  error: {
    /** A stable machine-readable code (e.g. `not_found`). */
    code: string
    /** A human-readable message. */
    message: string
  }
}

/** An error carrying the HTTP status and stable code to return to the client. */
export class ApiError extends Error {
  /** Build an error from its HTTP `status`, stable `code` and `message`. */
  constructor(
    readonly status: ContentfulStatusCode,
    readonly code: string,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }

  /** The response body for this error. */
  body(): ApiErrorBody {
    return { error: { code: this.code, message: this.message } }
  }
}

/** A 400 for a malformed request. */
export function badRequest(message: string): ApiError {
  return new ApiError(400, 'bad_request', message)
}

/** A 404 for a missing resource. */
export function notFound(message: string): ApiError {
  return new ApiError(404, 'not_found', message)
}

/** A 401 for a request with no authenticated user. */
export function unauthorized(message: string): ApiError {
  return new ApiError(401, 'unauthorized', message)
}
