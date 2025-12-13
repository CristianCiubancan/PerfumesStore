import { z } from 'zod'
import 'dotenv/config'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  CLIENT_URL: z.string().url().default('http://localhost:3000'),
  BACKEND_URL: z.string().url().default('http://localhost:4000'),
  // Cookie domain for cross-subdomain auth (e.g., ".example.com" for api.example.com + www.example.com)
  // Leave empty for same-origin deployments (cookies will be host-only)
  COOKIE_DOMAIN: z.string().optional(),
  // Comma-separated list of allowed external image hosts (e.g., "cdn.example.com,bucket.r2.cloudflarestorage.com")
  ALLOWED_IMAGE_HOSTS: z.string().default(''),
  // Stripe configuration
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().optional(), // Optional - needed for webhook signature verification
  // Resend email configuration
  RESEND_API_KEY: z.string().optional(), // Optional - emails disabled if not set
  RESEND_FROM_EMAIL: z.string().email().optional(), // Required if RESEND_API_KEY is set
  // OpenTelemetry configuration
  OTEL_ENABLED: z.string().default('false').transform(v => v === 'true'),
  OTEL_SERVICE_NAME: z.string().default('perfumes-store-api'),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(), // e.g., http://localhost:4318
  // Prometheus metrics configuration
  METRICS_ENABLED: z.string().default('false').transform(v => v === 'true'),
  METRICS_PORT: z.coerce.number().default(9090),
})

/**
 * Parses comma-separated host string into array of lowercase hosts.
 * Note: Similar function exists in client/lib/env.ts - kept separate due to package boundary.
 */
function parseAllowedHosts(hostsString: string): string[] {
  if (!hostsString.trim()) return []
  return hostsString.split(',').map(h => h.trim().toLowerCase()).filter(Boolean)
}

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const config = {
  ...parsed.data,
  allowedImageHosts: parseAllowedHosts(parsed.data.ALLOWED_IMAGE_HOSTS),
}

/**
 * Environment flag for production mode.
 * Use this instead of checking process.env.NODE_ENV directly.
 */
export const isProduction = parsed.data.NODE_ENV === 'production'
