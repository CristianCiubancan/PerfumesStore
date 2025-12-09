import { api, ApiClientOptions } from './client'
import {
  Product,
  ProductsResponse,
  CreateProductInput,
  UpdateProductInput,
  FilterOptions,
} from '@/types'

export interface ListProductsParams {
  page?: number
  limit?: number
  brand?: string
  gender?: string
  concentration?: string
  minPrice?: number
  maxPrice?: number
  search?: string
  sortBy?: 'name' | 'price' | 'rating' | 'newest' | 'stock'
  sortOrder?: 'asc' | 'desc'
  // Filter by lookup table IDs
  fragranceFamilyId?: number
  longevityId?: number
  sillageId?: number
  seasonIds?: number[]
  seasonMatchMode?: 'any' | 'all'
  occasionIds?: number[]
  occasionMatchMode?: 'any' | 'all'
  minRating?: number
  maxRating?: number
  // Stock status filter for admin
  stockStatus?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
}

export const productsApi = {
  list: (params?: ListProductsParams, options?: Omit<ApiClientOptions, 'method' | 'body'>) => {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Handle arrays - join with comma for API
          if (Array.isArray(value)) {
            if (value.length > 0) {
              searchParams.append(key, value.join(','))
            }
          } else {
            searchParams.append(key, String(value))
          }
        }
      })
    }
    const query = searchParams.toString()
    return api.get<ProductsResponse>(`/api/products${query ? `?${query}` : ''}`, options)
  },

  get: (id: number, options?: Omit<ApiClientOptions, 'method' | 'body'>) =>
    api.get<Product>(`/api/products/${id}`, options),

  /**
   * Get a product by its SEO-friendly slug
   * This is the primary method for fetching products on public pages
   */
  getBySlug: (slug: string, options?: Omit<ApiClientOptions, 'method' | 'body'>) =>
    api.get<Product>(`/api/products/by-slug/${slug}`, options),

  create: (data: CreateProductInput) =>
    api.post<Product>('/api/products', data),

  update: (id: number, data: UpdateProductInput) =>
    api.put<Product>(`/api/products/${id}`, data),

  delete: (id: number) =>
    api.delete<{ message: string }>(`/api/products/${id}`),

  bulkDelete: (ids: number[]) =>
    api.post<{ message: string; deletedCount: number }>('/api/products/bulk-delete', { ids }),

  getFilterOptions: () =>
    api.get<FilterOptions>('/api/products/filter-options'),

  getBrands: async () => {
    const result = await api.get<{ brands: string[] }>('/api/products/brands')
    return result.brands
  },

  getStats: () =>
    api.get<{ productCount: number; brandCount: number }>('/api/products/stats'),
}
