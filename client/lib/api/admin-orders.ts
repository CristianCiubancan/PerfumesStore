import { api } from './client'
import type { Order, OrderStatus } from '@/types'

export interface AdminListOrdersParams {
  page?: number
  limit?: number
  status?: OrderStatus | 'all'
  search?: string
  sortBy?: 'createdAt' | 'totalRON' | 'status'
  sortOrder?: 'asc' | 'desc'
}

export interface AdminOrder extends Order {
  user: {
    id: number
    email: string
    name: string
  } | null
}

export interface AdminOrdersResponse {
  orders: AdminOrder[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface OrderStats {
  byStatus: Record<OrderStatus, number>
  last24Hours: number
  totalRevenue: number
}

export const adminOrdersApi = {
  list: (params: AdminListOrdersParams = {}) => {
    const searchParams = new URLSearchParams()
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.limit) searchParams.set('limit', params.limit.toString())
    if (params.status && params.status !== 'all') searchParams.set('status', params.status)
    if (params.search) searchParams.set('search', params.search)
    if (params.sortBy) searchParams.set('sortBy', params.sortBy)
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder)

    const query = searchParams.toString()
    return api.get<AdminOrdersResponse>(`/api/admin/orders${query ? `?${query}` : ''}`)
  },

  get: (id: number) => api.get<AdminOrder>(`/api/admin/orders/${id}`),

  updateStatus: (id: number, status: OrderStatus) =>
    api.patch<AdminOrder>(`/api/admin/orders/${id}/status`, { status }),

  getStats: () => api.get<OrderStats>('/api/admin/orders/stats'),
}
