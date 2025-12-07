'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
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
      // Skip profile fetch on auth pages - user is not logged in
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

  return (
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
  )
}
