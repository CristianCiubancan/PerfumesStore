import { api } from './client'
import { NewsletterSubscriber, NewsletterSubscribersResponse } from '@/types'

export interface NewsletterSubscribeData {
  email: string
}

export interface NewsletterSubscribeResponse {
  message: string
  email: string
}

export interface ListSubscribersParams {
  page?: number
  limit?: number
  isActive?: boolean
}

export const newsletterApi = {
  // Public
  subscribe: (data: NewsletterSubscribeData) =>
    api.post<NewsletterSubscribeResponse>('/api/newsletter/subscribe', data),

  // Admin
  list: (params: ListSubscribersParams = {}) => {
    const searchParams = new URLSearchParams()
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.limit) searchParams.set('limit', params.limit.toString())
    if (params.isActive !== undefined) searchParams.set('isActive', params.isActive.toString())
    const queryString = searchParams.toString()
    return api.get<NewsletterSubscribersResponse>(
      `/api/admin/newsletter${queryString ? `?${queryString}` : ''}`
    )
  },

  unsubscribe: (id: number) =>
    api.post<NewsletterSubscriber>(`/api/admin/newsletter/${id}/unsubscribe`, {}),

  delete: (id: number) =>
    api.delete<NewsletterSubscriber>(`/api/admin/newsletter/${id}`),
}
