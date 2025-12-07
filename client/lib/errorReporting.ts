/**
 * Client-side error reporting utility.
 *
 * In development, logs errors to console.
 * In production, this could be expanded to send errors to a tracking service
 * (e.g., Sentry, LogRocket, or a custom backend endpoint).
 */

export interface ErrorContext {
  component?: string
  action?: string
  userId?: string
  [key: string]: unknown
}

/**
 * Reports an error for tracking/debugging.
 *
 * @param error - The error to report
 * @param context - Optional context about where/how the error occurred
 */
export function reportError(error: Error, context?: ErrorContext): void {
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error Report]', error, context)
  }

  // In production, send to an error tracking service:
  // - Sentry: Sentry.captureException(error, { extra: context })
  // - LogRocket: LogRocket.captureException(error)
  // - Custom API: fetch('/api/errors/report', { method: 'POST', body: JSON.stringify({ error, context }) })
}

/**
 * Reports a warning for tracking/debugging.
 *
 * @param message - The warning message
 * @param context - Optional context about the warning
 */
export function reportWarning(message: string, context?: ErrorContext): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[Warning]', message, context)
  }

  // In production, could send to analytics or logging service
}
