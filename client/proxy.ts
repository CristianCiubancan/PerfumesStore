import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

// Next.js 16: middleware.ts renamed to proxy.ts
// See: https://nextjs.org/docs/messages/middleware-to-proxy
export const proxy = createMiddleware(routing)

export const config = {
  // Match all pathnames except:
  // - API routes (/api/...)
  // - Next.js internals (/_next/...)
  // - Static files with extensions (.ico, .png, .jpg, etc.)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
}
