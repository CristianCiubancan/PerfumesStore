/**
 * Environment Configuration
 *
 * Centralized environment variable access with validation.
 * All env vars should be accessed through this module.
 */

/**
 * Parses comma-separated host string into array of lowercase hosts.
 * Note: Similar function exists in server/src/config/index.ts - kept separate due to package boundary.
 */
function parseAllowedHosts(hostsString: string | undefined): string[] {
  if (!hostsString?.trim()) return []
  return hostsString.split(',').map(h => h.trim().toLowerCase()).filter(Boolean)
}

// Client-side environment variables (must be prefixed with NEXT_PUBLIC_)
export const env = {
  // API Configuration
  // Use API_URL for server-side (Docker internal network), NEXT_PUBLIC_API_URL for client-side (browser)
  apiUrl:
    typeof window === 'undefined'
      ? process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',

  // Site Configuration
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  siteName: process.env.NEXT_PUBLIC_SITE_NAME || 'Perfumes Store',

  // Image Security - allowed external image hosts (e.g., Cloudflare R2)
  allowedImageHosts: parseAllowedHosts(process.env.NEXT_PUBLIC_ALLOWED_IMAGE_HOSTS),

  // Feature flags
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
} as const

// Validate required env vars in production
export function validateEnv() {
  const requiredInProd = [
    'NEXT_PUBLIC_SITE_URL',
    'NEXT_PUBLIC_API_URL',
  ] as const

  if (env.isProd) {
    const missing = requiredInProd.filter(
      (key) => !process.env[key]
    )

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables in production: ${missing.join(', ')}`
      )
    }
  }
}

// Run validation on import (only logs warnings, doesn't throw)
if (typeof window === 'undefined') {
  validateEnv()
}
