'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import PlausibleProvider from 'next-plausible'
import { useState, ReactNode, useEffect } from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import { useAuthStore } from '@/store/auth'
import { authApi } from '@/lib/api/auth'
import { QUERY } from '@/lib/constants'

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: QUERY.STALE_TIME_MS, retry: QUERY.RETRY_COUNT },
        },
      })
  )

  const clearAuth = useAuthStore((state) => state.clearAuth)
  const setAuth = useAuthStore((state) => state.setAuth)
  const setHydrating = useAuthStore((state) => state.setHydrating)

  useEffect(() => {
    const hydrateAuth = async () => {
      // FE-012: Auth hydration with path-based detection
      // This approach checks URL paths rather than route metadata because:
      // 1. This runs before Next.js page components mount (no access to metadata)
      // 2. Auth pages don't need profile fetching - reduces unnecessary API calls
      // 3. Simple path matching is reliable and easy to maintain
      // Future enhancement: Could use Next.js middleware for server-side detection
      const authPaths = ['/login', '/register']
      const isOnAuthPage = authPaths.some((path) => window.location.pathname.endsWith(path))
      if (isOnAuthPage) {
        setHydrating(false)
        return
      }

      try {
        const user = await authApi.getProfile()
        setAuth(user)
      } catch {
        clearAuth()
      } finally {
        setHydrating(false)
      }
    }

    hydrateAuth()
  }, [setAuth, clearAuth, setHydrating])

  useEffect(() => {
    const handleUnauthorized = () => {
      // Only clear auth state - let protected pages (admin) handle their own redirects
      clearAuth()
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [clearAuth])

  // Plausible domain from env, falls back to window.location.hostname
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN

  return (
    <PlausibleProvider
      domain={plausibleDomain || ''}
      enabled={!!plausibleDomain}
      trackOutboundLinks
      trackFileDownloads
    >
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <QueryClientProvider client={queryClient}>
          {children}
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </ThemeProvider>
    </PlausibleProvider>
  )
}
