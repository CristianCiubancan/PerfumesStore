import '@testing-library/jest-dom/vitest'
import { vi, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import React from 'react'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    if (params) {
      let result = key
      Object.entries(params).forEach(([k, v]) => {
        result = result.replace(`{${k}}`, String(v))
      })
      return result
    }
    return key
  },
  useLocale: () => 'en',
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => '/test',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock next/image
vi.mock('next/image', () => ({
  default: function MockImage(props: { src: string; alt: string; [key: string]: unknown }) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { src, alt, fill, priority, unoptimized, ...rest } = props
    return React.createElement('img', { src, alt, ...rest })
  },
}))

// Mock i18n routing
vi.mock('@/i18n/routing', () => ({
  Link: function MockLink(props: { href: string; children: React.ReactNode; [key: string]: unknown }) {
    const { href, children, ...rest } = props
    return React.createElement('a', { href, ...rest }, children)
  },
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => '/test',
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
  Toaster: () => null,
}))

// Mock environment
vi.mock('@/lib/env', () => ({
  env: {
    apiUrl: 'http://localhost:4000',
    siteUrl: 'http://localhost:3000',
    siteName: 'Test Perfumes Store',
    allowedImageHosts: ['example.com'],
    isDev: true,
    isProd: false,
  },
}))

// Mock upload helper
vi.mock('@/lib/api/upload', () => ({
  getFullImageUrl: (url: string) => url?.startsWith('/') ? `http://localhost:4000${url}` : url,
}))

// Mock api client
vi.mock('@/lib/api/client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    constructor(message: string, public status: number, public code?: string) {
      super(message)
      this.name = 'ApiError'
    }
  },
}))
