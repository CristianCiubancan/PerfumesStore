import { api } from './client'
import {
  Promotion,
  ActivePromotionResponse,
  CreatePromotionInput,
  UpdatePromotionInput,
} from '@/types'

interface ListPromotionsResponse {
  promotions: Promotion[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export const promotionsApi = {
  // Public - get currently active promotion
  getActive: () => api.get<ActivePromotionResponse>('/api/promotions/active'),

  // Admin - list all promotions
  list: async (): Promise<Promotion[]> => {
    const response = await api.get<ListPromotionsResponse>('/api/promotions')
    return response.promotions
  },

  // Admin - get single promotion
  get: (id: number) => api.get<Promotion>(`/api/promotions/${id}`),

  // Admin - create promotion
  create: (data: CreatePromotionInput) =>
    api.post<Promotion>('/api/promotions', data),

  // Admin - update promotion
  update: (id: number, data: UpdatePromotionInput) =>
    api.put<Promotion>(`/api/promotions/${id}`, data),

  // Admin - delete promotion
  delete: (id: number) =>
    api.delete<{ message: string }>(`/api/promotions/${id}`),
}
