/**
 * Client-side error reporting utility with Sentry integration.
 *
 * In development, logs errors to console.
 * In production, sends errors to Sentry (if configured) or a fallback endpoint.
 *
 * Sentry is now properly integrated via:
 * - sentry.client.config.ts (browser)
 * - sentry.server.config.ts (Node.js)
 * - sentry.edge.config.ts (Edge runtime)
 * - instrumentation.ts (Next.js instrumentation)
 */

import * as Sentry from "@sentry/nextjs";

const isSentryEnabled = (): boolean => {
  return !!process.env.NEXT_PUBLIC_SENTRY_DSN;
};

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  [key: string]: unknown;
}

/**
 * Initialize Sentry for error tracking.
 * Note: Sentry is now auto-initialized via instrumentation.ts and sentry.*.config.ts files.
 * This function is kept for backwards compatibility.
 */
export async function initErrorReporting(): Promise<void> {
  // Sentry is auto-initialized via configuration files
  // This is now a no-op but kept for backwards compatibility
}

/**
 * Reports an error for tracking/debugging.
 *
 * @param error - The error to report
 * @param context - Optional context about where/how the error occurred
 */
export function reportError(error: Error, context?: ErrorContext): void {
  // Always log in development
  if (process.env.NODE_ENV === "development") {
    console.error("[Error Report]", error, context);
  }

  if (isSentryEnabled()) {
    Sentry.withScope((scope) => {
      if (context) {
        if (context.component) scope.setTag("component", context.component);
        if (context.action) scope.setTag("action", context.action);
        if (context.userId) scope.setUser({ id: context.userId });

        // Pass extra context data (excluding known fields already used above)
        const extraContext = Object.fromEntries(
          Object.entries(context).filter(
            ([k]) => !["component", "action", "userId"].includes(k)
          )
        );
        if (Object.keys(extraContext).length > 0) {
          scope.setExtras(extraContext);
        }
      }
      Sentry.captureException(error);
    });
  } else if (process.env.NODE_ENV === "production") {
    // Fallback: send to server endpoint if Sentry is not configured
    fetch("/api/errors/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {
      // Silently fail - error reporting should never break the app
    });
  }
}

/**
 * Reports a warning for tracking/debugging.
 *
 * @param message - The warning message
 * @param context - Optional context about the warning
 */
export function reportWarning(message: string, context?: ErrorContext): void {
  // Always log in development
  if (process.env.NODE_ENV === "development") {
    console.warn("[Warning]", message, context);
  }

  if (isSentryEnabled()) {
    Sentry.withScope((scope) => {
      scope.setLevel("warning");
      if (context) {
        if (context.component) scope.setTag("component", context.component);
        if (context.action) scope.setTag("action", context.action);
        scope.setExtras(context);
      }
      Sentry.captureMessage(message);
    });
  }
}

/**
 * Set user context for error tracking.
 * Call this after user authentication.
 */
export function setErrorReportingUser(user: { id: string; email?: string }): void {
  if (!isSentryEnabled()) return;
  Sentry.setUser(user);
}

/**
 * Clear user context from error tracking.
 * Call this after user logout.
 */
export function clearErrorReportingUser(): void {
  if (!isSentryEnabled()) return;
  Sentry.setUser(null);
}
