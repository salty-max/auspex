import * as Sentry from '@sentry/bun'

/** Whether Sentry is configured; without a DSN, capture is a no-op. */
function enabled(): boolean {
  return Boolean(process.env.SENTRY_DSN)
}

/** Initialize error reporting. Safe to call when no DSN is set — it does nothing. */
export function initObservability(): void {
  if (enabled()) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    })
  }
}

/** Report an unexpected error to Sentry, when configured. */
export function captureError(error: unknown): void {
  if (enabled()) {
    Sentry.captureException(error)
  }
}
