import { env } from '@/lib/env'

const API_URL = env.apiUrl
const CSRF_COOKIE_NAME = 'csrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'

export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Read CSRF token from cookie for double-submit pattern
 */
export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null

  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === CSRF_COOKIE_NAME) {
      return decodeURIComponent(value)
    }
  }
  return null
}

// Track in-flight CSRF fetch to prevent duplicate requests
let csrfFetchPromise: Promise<void> | null = null

/**
 * Ensure a CSRF token exists. If not, fetch one from the server.
 * Multiple concurrent calls will share the same fetch request.
 */
async function ensureCsrfToken(): Promise<void> {
  if (typeof document === 'undefined') return
  if (getCsrfToken()) return

  if (!csrfFetchPromise) {
    csrfFetchPromise = fetch(`${API_URL}/api/auth/csrf`, {
      method: 'GET',
      credentials: 'include',
    })
      .then(() => {
        // Cookie is set by the server response
      })
      .finally(() => {
        csrfFetchPromise = null
      })
  }

  await csrfFetchPromise
}

let refreshPromise: Promise<boolean> | null = null

async function refreshToken(): Promise<boolean> {
  try {
    // Ensure CSRF token exists before refresh request (it's a POST)
    await ensureCsrfToken()

    const headers: Record<string, string> = {}
    const csrfToken = getCsrfToken()
    if (csrfToken) {
      headers[CSRF_HEADER_NAME] = csrfToken
    }

    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers,
    })
    return response.ok
  } catch {
    return false
  }
}

function dispatchUnauthorized() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth:unauthorized'))
  }
}

/**
 * Base fetch wrapper that handles authentication for all request types.
 * - Automatically includes credentials (cookies)
 * - Handles 401 by refreshing token and retrying once
 * - Coordinates concurrent refreshes (only one refresh at a time, all waiters share result)
 * - Dispatches 'auth:unauthorized' event when refresh fails
 */
export async function authenticatedFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  retryOnUnauth = true
): Promise<Response> {
  const response = await fetch(input, {
    ...init,
    credentials: 'include',
  })

  if (response.status === 401 && retryOnUnauth) {
    // Coordinate refresh - all concurrent 401s wait for the same refresh
    if (!refreshPromise) {
      refreshPromise = refreshToken().finally(() => {
        refreshPromise = null
      })
    }

    const refreshed = await refreshPromise

    if (refreshed) {
      // Retry the original request with new token
      return authenticatedFetch(input, init, false)
    }

    // Refresh failed - dispatch unauthorized event
    dispatchUnauthorized()
  }

  return response
}

export interface ApiClientOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
}

/**
 * API client for JSON requests. Uses authenticatedFetch for auth handling.
 * Automatically includes CSRF token for state-changing methods.
 */
export async function apiClient<T>(
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const { body, ...restOptions } = options
  const method = restOptions.method?.toUpperCase() || 'GET'
  const needsCsrf = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)

  // Ensure CSRF token exists before state-changing requests
  if (needsCsrf) {
    await ensureCsrfToken()
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Add CSRF token for state-changing requests
  if (needsCsrf) {
    const csrfToken = getCsrfToken()
    if (csrfToken) {
      headers[CSRF_HEADER_NAME] = csrfToken
    }
  }

  const response = await authenticatedFetch(`${API_URL}${endpoint}`, {
    ...restOptions,
    headers: {
      ...headers,
      ...restOptions.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  // Parse JSON - only catch for error responses to extract error details
  let data: { data?: T; error?: { message?: string; code?: string } }
  try {
    data = await response.json()
  } catch {
    if (!response.ok) {
      // Failed to parse error response - throw generic error with status
      throw new ApiError('Request failed', response.status)
    }
    // Successful response but invalid JSON - this is a real error
    throw new ApiError(
      'Invalid response format from server',
      response.status,
      'INVALID_RESPONSE'
    )
  }

  if (!response.ok) {
    throw new ApiError(
      data.error?.message || 'Request failed',
      response.status,
      data.error?.code
    )
  }

  return data.data as T
}

export const api = {
  get: <T>(endpoint: string, options?: Omit<ApiClientOptions, 'method' | 'body'>) =>
    apiClient<T>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, body?: unknown, options?: Omit<ApiClientOptions, 'method' | 'body'>) =>
    apiClient<T>(endpoint, { ...options, method: 'POST', body }),
  put: <T>(endpoint: string, body?: unknown, options?: Omit<ApiClientOptions, 'method' | 'body'>) =>
    apiClient<T>(endpoint, { ...options, method: 'PUT', body }),
  patch: <T>(endpoint: string, body?: unknown, options?: Omit<ApiClientOptions, 'method' | 'body'>) =>
    apiClient<T>(endpoint, { ...options, method: 'PATCH', body }),
  delete: <T>(endpoint: string, options?: Omit<ApiClientOptions, 'method' | 'body'>) =>
    apiClient<T>(endpoint, { ...options, method: 'DELETE' }),
}
