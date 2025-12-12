/**
 * Hook for managing admin product filters with URL synchronization
 */
import { useState, useCallback, useRef, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useDebounce } from '@/hooks/use-debounce'
import { PAGINATION, TIMING } from '@/lib/constants'

export type SortField = 'name' | 'price' | 'stock' | 'newest'
export type SortOrder = 'asc' | 'desc'
export type StockStatus = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'

export interface AdminProductFilters {
  searchQuery: string
  debouncedSearch: string
  concentration: string
  gender: string
  stockStatus: StockStatus
  sortBy: SortField
  sortOrder: SortOrder
  page: number
  limit: number
  hasActiveFilters: boolean
}

export interface UseAdminProductFiltersResult {
  filters: AdminProductFilters
  setSearchQuery: (query: string) => void
  setConcentration: (value: string) => void
  setGender: (value: string) => void
  setStockStatus: (value: StockStatus) => void
  handleSort: (field: SortField) => void
  handlePageChange: (page: number) => void
  handlePageSizeChange: (size: string) => void
  clearFilters: () => void
}

export function useAdminProductFilters(): UseAdminProductFiltersResult {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Initialize state from URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const debouncedSearch = useDebounce(searchQuery, TIMING.DEBOUNCE_SHORT_MS)
  const [concentration, setConcentration] = useState(searchParams.get('concentration') || 'all')
  const [gender, setGender] = useState(searchParams.get('gender') || 'all')
  const [stockStatus, setStockStatus] = useState<StockStatus>(
    (searchParams.get('stockStatus') as StockStatus) || 'all'
  )
  const [sortBy, setSortBy] = useState<SortField>(
    (searchParams.get('sortBy') as SortField) || 'newest'
  )
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    (searchParams.get('sortOrder') as SortOrder) || 'desc'
  )

  const pageParam = searchParams.get('page') || '1'
  const limitParam = searchParams.get('limit') || String(PAGINATION.ADMIN_DEFAULT_LIMIT)
  const page = parseInt(pageParam, 10)
  const limit = parseInt(limitParam, 10)

  const updateUrlParams = useCallback(
    (params: Record<string, string | undefined>) => {
      const current = new URLSearchParams(window.location.search)
      Object.entries(params).forEach(([key, value]) => {
        if (value && value !== 'all' && value !== '') {
          current.set(key, value)
        } else {
          current.delete(key)
        }
      })
      router.replace(`${pathname}?${current.toString()}`, { scroll: false })
    },
    [pathname, router]
  )

  // Sync debounced search to URL
  const prevDebouncedSearch = useRef(debouncedSearch)
  useEffect(() => {
    if (prevDebouncedSearch.current === debouncedSearch) {
      return
    }
    prevDebouncedSearch.current = debouncedSearch
    updateUrlParams({ search: debouncedSearch, page: '1' })
  }, [debouncedSearch, updateUrlParams])

  const handleSort = useCallback(
    (field: SortField) => {
      let newOrder: SortOrder = 'asc'
      if (sortBy === field) {
        newOrder = sortOrder === 'asc' ? 'desc' : 'asc'
      }
      setSortBy(field)
      setSortOrder(newOrder)
      updateUrlParams({ sortBy: field, sortOrder: newOrder, page: '1' })
    },
    [sortBy, sortOrder, updateUrlParams]
  )

  const handlePageChange = useCallback(
    (newPage: number) => {
      updateUrlParams({ page: newPage.toString() })
    },
    [updateUrlParams]
  )

  const handlePageSizeChange = useCallback(
    (newSize: string) => {
      updateUrlParams({ limit: newSize, page: '1' })
    },
    [updateUrlParams]
  )

  const handleConcentrationChange = useCallback(
    (value: string) => {
      setConcentration(value)
      updateUrlParams({ concentration: value, page: '1' })
    },
    [updateUrlParams]
  )

  const handleGenderChange = useCallback(
    (value: string) => {
      setGender(value)
      updateUrlParams({ gender: value, page: '1' })
    },
    [updateUrlParams]
  )

  const handleStockStatusChange = useCallback(
    (value: StockStatus) => {
      setStockStatus(value)
      updateUrlParams({ stockStatus: value, page: '1' })
    },
    [updateUrlParams]
  )

  const clearFilters = useCallback(() => {
    setSearchQuery('')
    setConcentration('all')
    setGender('all')
    setStockStatus('all')
    setSortBy('newest')
    setSortOrder('desc')
    router.replace(pathname, { scroll: false })
  }, [pathname, router])

  const hasActiveFilters =
    Boolean(searchQuery) ||
    concentration !== 'all' ||
    gender !== 'all' ||
    stockStatus !== 'all'

  return {
    filters: {
      searchQuery,
      debouncedSearch,
      concentration,
      gender,
      stockStatus,
      sortBy,
      sortOrder,
      page,
      limit,
      hasActiveFilters,
    },
    setSearchQuery,
    setConcentration: handleConcentrationChange,
    setGender: handleGenderChange,
    setStockStatus: handleStockStatusChange,
    handleSort,
    handlePageChange,
    handlePageSizeChange,
    clearFilters,
  }
}
