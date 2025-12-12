/**
 * Hook for managing admin products - data fetching and mutations
 */
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { productsApi, ListProductsParams } from '@/lib/api/products'
import { Product } from '@/types'
import { ApiError } from '@/lib/api/client'
import type { AdminProductFilters } from './use-admin-product-filters'

interface UseAdminProductsOptions {
  filters: AdminProductFilters
  onDataLoaded?: () => void
}

interface UseAdminProductsResult {
  products: Product[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  isLoading: boolean
  loadProducts: () => Promise<void>
  deleteProduct: (id: number) => Promise<boolean>
  bulkDeleteProducts: (ids: number[]) => Promise<boolean>
}

export function useAdminProducts({
  filters,
  onDataLoaded,
}: UseAdminProductsOptions): UseAdminProductsResult {
  const t = useTranslations()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: filters.limit,
    total: 0,
    totalPages: 0,
  })

  const loadProducts = useCallback(async () => {
    setIsLoading(true)
    try {
      const params: ListProductsParams = {
        page: filters.page,
        limit: filters.limit,
        search: filters.debouncedSearch || undefined,
        concentration: filters.concentration !== 'all' ? filters.concentration : undefined,
        gender: filters.gender !== 'all' ? filters.gender : undefined,
        stockStatus: filters.stockStatus !== 'all' ? filters.stockStatus : undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      }
      const response = await productsApi.list(params)
      setProducts(response.products)
      setPagination(response.pagination)
      onDataLoaded?.()
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message)
      } else {
        toast.error(t('admin.failedToLoad'))
      }
    } finally {
      setIsLoading(false)
    }
  }, [
    filters.page,
    filters.limit,
    filters.debouncedSearch,
    filters.concentration,
    filters.gender,
    filters.stockStatus,
    filters.sortBy,
    filters.sortOrder,
    onDataLoaded,
    t,
  ])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const deleteProduct = useCallback(
    async (id: number): Promise<boolean> => {
      try {
        await productsApi.delete(id)
        toast.success(t('admin.deleteDialog.success'))
        await loadProducts()
        return true
      } catch (error) {
        if (error instanceof ApiError) {
          toast.error(error.message)
        } else {
          toast.error(t('admin.deleteDialog.error'))
        }
        return false
      }
    },
    [loadProducts, t]
  )

  const bulkDeleteProducts = useCallback(
    async (ids: number[]): Promise<boolean> => {
      try {
        const result = await productsApi.bulkDelete(ids)
        toast.success(t('admin.products.bulkDeleteSuccess', { count: result.deletedCount }))
        await loadProducts()
        return true
      } catch (error) {
        if (error instanceof ApiError) {
          toast.error(error.message)
        } else {
          toast.error(t('admin.products.bulkDeleteError'))
        }
        return false
      }
    },
    [loadProducts, t]
  )

  return {
    products,
    pagination,
    isLoading,
    loadProducts,
    deleteProduct,
    bulkDeleteProducts,
  }
}
