import { ApiError, authenticatedFetch, getCsrfToken } from './client'
import { env } from '@/lib/env'
import { isAllowedImageUrl } from '@/lib/schemas/product'

const API_URL = env.apiUrl

export interface UploadResponse {
  imageUrl: string
  filename: string
}

export async function uploadImage(file: File): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append('image', file)

  // Build headers with CSRF token for file uploads
  const headers: Record<string, string> = {}
  const csrfToken = getCsrfToken()
  if (csrfToken) {
    headers['x-csrf-token'] = csrfToken
  }

  const response = await authenticatedFetch(`${API_URL}/api/upload`, {
    method: 'POST',
    body: formData,
    headers,
    // Note: Don't set Content-Type for FormData - browser sets it with boundary
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new ApiError(
      data.error?.message || 'Upload failed',
      response.status,
      data.error?.code
    )
  }

  return data.data
}

export function getFullImageUrl(imageUrl: string): string {
  if (!imageUrl) return ''

  // For relative paths, prepend the API URL
  if (imageUrl.startsWith('/uploads/')) {
    return `${API_URL}${imageUrl}`
  }

  // For full URLs, validate against allowed hosts
  if (imageUrl.startsWith('http')) {
    if (isAllowedImageUrl(imageUrl)) {
      return imageUrl
    }
    // Return empty string for disallowed external URLs
    return ''
  }

  return ''
}
