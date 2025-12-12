/**
 * Client-side error reporting utility with optional Sentry integration.
 *
 * In development, logs errors to console.
 * In production, sends errors to Sentry (if configured) or a fallback endpoint.
 *
 * Setup for Sentry:
 * 1. Install Sentry: npm install @sentry/nextjs
 * 2. Set NEXT_PUBLIC_SENTRY_DSN in your environment
 * 3. Run: npx @sentry/wizard@latest -i nextjs
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// Sentry is lazily loaded to make it optional
let SentryModule: any = null
let sentryLoadAttempted = false

const loadSentry = async (): Promise<any | null> => {
  if (SentryModule) return SentryModule
  if (sentryLoadAttempted) return null

  sentryLoadAttempted = true
  try {
    // Use Function constructor to avoid TypeScript checking the module
    const dynamicImport = new Function('moduleName', 'return import(moduleName)')
    SentryModule = await dynamicImport('@sentry/nextjs')
    return SentryModule
  } catch {
    return null
  }
}

const isSentryEnabled = (): boolean => {
  return (
    process.env.NODE_ENV === 'production' &&
    !!process.env.NEXT_PUBLIC_SENTRY_DSN
  )
}

export interface ErrorContext {
  component?: string
  action?: string
  userId?: string
  [key: string]: unknown
}

/**
 * Initialize Sentry for error tracking (call once at app startup).
 * Safe to call even if Sentry is not installed - will no-op.
 */
export async function initErrorReporting(): Promise<void> {
  if (!isSentryEnabled()) return

  const sentry = await loadSentry()
  if (!sentry) return

  sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  })
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
    return
  }

  if (isSentryEnabled()) {
    loadSentry().then((sentry) => {
      if (!sentry) return
      sentry.withScope((scope: any) => {
        if (context) {
          if (context.component) scope.setTag('component', context.component)
          if (context.action) scope.setTag('action', context.action)
          if (context.userId) scope.setUser({ id: context.userId })

          // Pass extra context data (excluding known fields already used above)
          const extraContext = Object.fromEntries(
            Object.entries(context).filter(([k]) => !['component', 'action', 'userId'].includes(k))
          )
          if (Object.keys(extraContext).length > 0) {
            scope.setExtras(extraContext)
          }
        }
        sentry.captureException(error)
      })
    })
  } else {
    // Fallback: send to server endpoint if Sentry is not configured
    fetch('/api/errors/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {
      // Silently fail - error reporting should never break the app
    })
  }
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
    return
  }

  if (isSentryEnabled()) {
    loadSentry().then((sentry) => {
      if (!sentry) return
      sentry.withScope((scope: any) => {
        scope.setLevel('warning')
        if (context) {
          if (context.component) scope.setTag('component', context.component)
          if (context.action) scope.setTag('action', context.action)
          scope.setExtras(context)
        }
        sentry.captureMessage(message)
      })
    })
  }
}

/**
 * Set user context for error tracking.
 * Call this after user authentication.
 */
export function setErrorReportingUser(user: { id: string; email?: string }): void {
  if (!isSentryEnabled()) return
  loadSentry().then((sentry) => sentry?.setUser(user))
}

/**
 * Clear user context from error tracking.
 * Call this after user logout.
 */
export function clearErrorReportingUser(): void {
  if (!isSentryEnabled()) return
  loadSentry().then((sentry) => sentry?.setUser(null))
}
