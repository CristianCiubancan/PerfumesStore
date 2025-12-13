import createMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

// Content Security Policy configuration
function getCSPHeader(nonce: string): string {
  const isDev = process.env.NODE_ENV === 'development'

  // Base directives
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`,
      // Allow Next.js inline scripts in development
      ...(isDev ? ["'unsafe-eval'"] : []),
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for Tailwind CSS and inline styles
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https://fimgs.net',
      // Allow localhost images in development
      ...(isDev ? ['http://localhost:*', 'http://server:*'] : []),
    ],
    'font-src': ["'self'", 'data:'],
    'connect-src': [
      "'self'",
      // API connections
      process.env.NEXT_PUBLIC_API_URL || '',
      // Stripe checkout redirect
      'https://checkout.stripe.com',
      'https://api.stripe.com',
      // Allow localhost in development
      ...(isDev ? ['http://localhost:*', 'ws://localhost:*'] : []),
    ].filter(Boolean),
    'frame-src': [
      "'self'",
      // Stripe checkout iframe (if ever used)
      'https://checkout.stripe.com',
      'https://js.stripe.com',
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'", 'https://checkout.stripe.com'],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': [],
  }

  // Remove upgrade-insecure-requests in development
  if (isDev) {
    delete directives['upgrade-insecure-requests']
  }

  return Object.entries(directives)
    .map(([key, values]) => {
      if (values.length === 0) {
        return key
      }
      return `${key} ${values.join(' ')}`
    })
    .join('; ')
}

// Generate a cryptographically secure nonce
function generateNonce(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Buffer.from(array).toString('base64')
}

export function middleware(request: NextRequest) {
  // Handle internationalization
  const response = intlMiddleware(request)

  // Generate nonce for CSP
  const nonce = generateNonce()

  // Add security headers
  const headers = response.headers

  // Content Security Policy
  headers.set('Content-Security-Policy', getCSPHeader(nonce))

  // Prevent clickjacking
  headers.set('X-Frame-Options', 'DENY')

  // Prevent MIME type sniffing
  headers.set('X-Content-Type-Options', 'nosniff')

  // Enable XSS filter (legacy browsers)
  headers.set('X-XSS-Protection', '1; mode=block')

  // Control referrer information
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Restrict browser features
  headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )

  // Pass nonce to the app via header (for script tags if needed)
  headers.set('x-nonce', nonce)

  return response
}

export const config = {
  // Match all paths except static files, api routes, and Next.js internals
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, robots.txt, sitemap.xml (static files)
     * - api routes
     * - public folder files with extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
