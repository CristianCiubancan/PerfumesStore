/**
 * Sentry client-side configuration.
 * This configures Sentry for the browser environment.
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Enable only if DSN is set
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust sample rate in production (0.1 = 10% of transactions)
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Session replay for debugging user issues
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Set environment
  environment: process.env.NODE_ENV,

  // Only send errors in production
  beforeSend(event) {
    if (process.env.NODE_ENV === "development") {
      console.log("[Sentry] Would send event:", event);
      return null;
    }
    return event;
  },

  // Integrations
  integrations: [
    Sentry.replayIntegration({
      // Mask all text content for privacy
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
