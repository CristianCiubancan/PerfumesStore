'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { productsApi } from '@/lib/api/products'
import { FilterCounts } from '@/types'
import { FilterValues } from './use-filter-params'
import { TIMING } from '@/lib/constants'
import { buildPriceFilterParams, CurrencyCode, ExchangeRates } from '@/lib/currency-helpers'

export type { FilterCounts }

interface UseFilterCountsOptions {
  /** Current currency code */
  currency?: CurrencyCode
  /** Exchange rates for currency conversion */
  exchangeRates?: ExchangeRates | null
}

/**
 * Hook to fetch filter counts based on current filter selection.
 * Returns counts for each filter option to show how many products would match.
 */
export function useFilterCounts(
  filters: FilterValues,
  options: UseFilterCountsOptions = {}
) {
  const { currency = 'RON', exchangeRates = null } = options
  const [filterCounts, setFilterCounts] = useState<FilterCounts | null>(null)
  const [isLoadingCounts, setIsLoadingCounts] = useState(true)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Build API params from filters using shared utility
  const apiParams = useMemo(() => {
    const priceParams = buildPriceFilterParams(
      filters.minPrice,
      filters.maxPrice,
      currency,
      exchangeRates
    )

    return {
      search: filters.search || undefined,
      gender: filters.gender || undefined,
      concentration: filters.concentration || undefined,
      ...priceParams,
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
    filters.search,
    filters.gender,
    filters.concentration,
    filters.minPrice,
    filters.maxPrice,
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

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Abort any in-flight request
      abortControllerRef.current?.abort()

      const controller = new AbortController()
      abortControllerRef.current = controller

      setIsLoadingCounts(true)

      productsApi
        .getFilterCounts(apiParams, { signal: controller.signal })
        .then((counts) => {
          if (!controller.signal.aborted) {
            setFilterCounts(counts)
          }
        })
        .catch((error) => {
          // Ignore abort errors
          if (error instanceof Error && error.name === 'AbortError') {
            return
          }
          if (process.env.NODE_ENV === 'development') {
            console.error('Failed to load filter counts:', error)
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setIsLoadingCounts(false)
          }
        })
    }, TIMING.DEBOUNCE_SHORT_MS)

    return () => {
      clearTimeout(timeoutId)
      abortControllerRef.current?.abort()
    }
  }, [apiParams])

  return { filterCounts, isLoadingCounts }
}
