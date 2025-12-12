/**
 * Custom hook for managing store products - fetching, filtering, and pagination
 * Extracted from StorePageClient for better testability and separation of concerns
 */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { productsApi } from '@/lib/api/products'
import { Product } from '@/types'
import { FilterValues } from '@/hooks/use-filter-params'
import { useCurrencyStore } from '@/store/currency'
import { PAGINATION, TIMING } from '@/lib/constants'
import { buildPriceFilterParams } from '@/lib/currency-helpers'

interface UseStoreProductsOptions {
  filters: FilterValues
  page: number
  onScrollToTop?: () => void
}

interface UseStoreProductsResult {
  products: Product[]
  pagination: {
    page: number
    totalPages: number
    total: number
  }
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useStoreProducts({
  filters,
  page,
  onScrollToTop,
}: UseStoreProductsOptions): UseStoreProductsResult {
  const t = useTranslations()
  const { currency, exchangeRates } = useCurrencyStore()
  const [products, setProducts] = useState<Product[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Ref to track the current AbortController for cancelling in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null)
  // Track if this is the initial load (don't scroll on first load)
  const isInitialLoadRef = useRef(true)

  // Memoize API params to prevent unnecessary re-fetches
  const apiParams = useMemo(() => {
    const priceParams = buildPriceFilterParams(
      filters.minPrice,
      filters.maxPrice,
      currency,
      exchangeRates
    )

    return {
      page,
      limit: PAGINATION.PRODUCTS_PER_PAGE,
      search: filters.search || undefined,
      gender: filters.gender || undefined,
      concentration: filters.concentration || undefined,
      ...priceParams,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      fragranceFamilyId: filters.fragranceFamilyId ?? undefined,
      longevityId: filters.longevityId ?? undefined,
      sillageId: filters.sillageId ?? undefined,
      seasonIds: filters.seasonIds.length > 0 ? filters.seasonIds : undefined,
      seasonMatchMode: filters.seasonMatchMode,
      occasionIds: filters.occasionIds.length > 0 ? filters.occasionIds : undefined,
      occasionMatchMode: filters.occasionMatchMode,
      minRating: filters.minRating ? parseFloat(filters.minRating) : undefined,
      maxRating: filters.maxRating ? parseFloat(filters.maxRating) : undefined,
    }
  }, [
    page,
    filters.search,
    filters.gender,
    filters.concentration,
    filters.minPrice,
    filters.maxPrice,
    filters.sortBy,
    filters.sortOrder,
    filters.fragranceFamilyId,
    filters.longevityId,
    filters.sillageId,
    filters.seasonIds,
    filters.seasonMatchMode,
    filters.occasionIds,
    filters.occasionMatchMode,
    filters.minRating,
    filters.maxRating,
    currency,
    exchangeRates,
  ])

  const fetchProducts = useCallback(
    async (signal?: AbortSignal, shouldScroll = false) => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await productsApi.list(apiParams, { signal })

        setProducts(response.products)
        setPagination({
          page: response.pagination.page,
          totalPages: response.pagination.totalPages,
          total: response.pagination.total,
        })

        // Scroll to top after successful fetch (but not on initial load)
        if (shouldScroll && onScrollToTop) {
          onScrollToTop()
        }
      } catch (err: unknown) {
        // Don't set error state for aborted requests
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }
        setError(t('store.errorLoading'))
      } finally {
        // Only clear loading if request wasn't aborted
        if (!signal?.aborted) {
          setIsLoading(false)
        }
      }
    },
    [apiParams, t, onScrollToTop]
  )

  // Debounced fetch when filters or page change
  useEffect(() => {
    const shouldScroll = !isInitialLoadRef.current

    const timeoutId = setTimeout(() => {
      // Abort any in-flight request before starting a new one
      abortControllerRef.current?.abort()

      const controller = new AbortController()
      abortControllerRef.current = controller

      fetchProducts(controller.signal, shouldScroll)

      // Mark initial load as complete after first fetch
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false
      }
    }, TIMING.DEBOUNCE_SHORT_MS)

    return () => {
      clearTimeout(timeoutId)
      // Abort on cleanup (component unmount or deps change before debounce fires)
      abortControllerRef.current?.abort()
    }
  }, [fetchProducts])

  const refetch = useCallback(() => {
    fetchProducts()
  }, [fetchProducts])

  return {
    products,
    pagination,
    isLoading,
    error,
    refetch,
  }
}
