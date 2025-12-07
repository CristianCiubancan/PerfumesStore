'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import { Gender, Concentration } from '@/types'

export interface FilterValues {
  search: string
  gender: Gender | ''
  concentration: Concentration | ''
  minPrice: string
  maxPrice: string
  sortBy: 'name' | 'price' | 'rating' | 'newest'
  sortOrder: 'asc' | 'desc'
  // Filters using lookup table IDs
  fragranceFamilyId: number | null
  longevityId: number | null
  sillageId: number | null
  seasonIds: number[]
  seasonMatchMode: 'any' | 'all'
  occasionIds: number[]
  occasionMatchMode: 'any' | 'all'
  minRating: string
  maxRating: string
}

export const DEFAULT_FILTERS: FilterValues = {
  search: '',
  gender: '',
  concentration: '',
  minPrice: '',
  maxPrice: '',
  sortBy: 'newest',
  sortOrder: 'desc',
  fragranceFamilyId: null,
  longevityId: null,
  sillageId: null,
  seasonIds: [],
  seasonMatchMode: 'any',
  occasionIds: [],
  occasionMatchMode: 'any',
  minRating: '',
  maxRating: '',
}

function parseIntOrNull(value: string | null): number | null {
  if (!value) return null
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? null : parsed
}

function parseIntArray(value: string | null): number[] {
  if (!value) return []
  return value
    .split(',')
    .filter(Boolean)
    .map((v) => parseInt(v, 10))
    .filter((n) => !isNaN(n))
}

export function useFilterParams() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Parse filters from URL
  const filters = useMemo<FilterValues>(() => {
    return {
      search: searchParams.get('search') || '',
      gender: (searchParams.get('gender') as Gender) || '',
      concentration: (searchParams.get('concentration') as Concentration) || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      sortBy: (searchParams.get('sortBy') as FilterValues['sortBy']) || 'newest',
      sortOrder: (searchParams.get('sortOrder') as FilterValues['sortOrder']) || 'desc',
      fragranceFamilyId: parseIntOrNull(searchParams.get('fragranceFamilyId')),
      longevityId: parseIntOrNull(searchParams.get('longevityId')),
      sillageId: parseIntOrNull(searchParams.get('sillageId')),
      seasonIds: parseIntArray(searchParams.get('seasonIds')),
      seasonMatchMode: (searchParams.get('seasonMatchMode') as 'any' | 'all') || 'any',
      occasionIds: parseIntArray(searchParams.get('occasionIds')),
      occasionMatchMode: (searchParams.get('occasionMatchMode') as 'any' | 'all') || 'any',
      minRating: searchParams.get('minRating') || '',
      maxRating: searchParams.get('maxRating') || '',
    }
  }, [searchParams])

  const page = parseInt(searchParams.get('page') || '1', 10)

  // Update URL when filters change
  const setFilters = useCallback(
    (newFilters: FilterValues) => {
      const params = new URLSearchParams()

      // Only add non-default values to URL
      if (newFilters.search) params.set('search', newFilters.search)
      if (newFilters.gender) params.set('gender', newFilters.gender)
      if (newFilters.concentration) params.set('concentration', newFilters.concentration)
      if (newFilters.minPrice) params.set('minPrice', newFilters.minPrice)
      if (newFilters.maxPrice) params.set('maxPrice', newFilters.maxPrice)
      if (newFilters.sortBy !== 'newest') params.set('sortBy', newFilters.sortBy)
      if (newFilters.sortOrder !== 'desc') params.set('sortOrder', newFilters.sortOrder)
      if (newFilters.fragranceFamilyId !== null) params.set('fragranceFamilyId', String(newFilters.fragranceFamilyId))
      if (newFilters.longevityId !== null) params.set('longevityId', String(newFilters.longevityId))
      if (newFilters.sillageId !== null) params.set('sillageId', String(newFilters.sillageId))
      if (newFilters.seasonIds.length > 0) params.set('seasonIds', newFilters.seasonIds.join(','))
      if (newFilters.seasonMatchMode !== 'any') params.set('seasonMatchMode', newFilters.seasonMatchMode)
      if (newFilters.occasionIds.length > 0) params.set('occasionIds', newFilters.occasionIds.join(','))
      if (newFilters.occasionMatchMode !== 'any') params.set('occasionMatchMode', newFilters.occasionMatchMode)
      if (newFilters.minRating) params.set('minRating', newFilters.minRating)
      if (newFilters.maxRating) params.set('maxRating', newFilters.maxRating)

      // Reset page to 1 when filters change
      const query = params.toString()
      router.push(`${pathname}${query ? `?${query}` : ''}`, { scroll: false })
    },
    [router, pathname]
  )

  const setPage = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams.toString())
      if (newPage === 1) {
        params.delete('page')
      } else {
        params.set('page', String(newPage))
      }
      const query = params.toString()
      router.push(`${pathname}${query ? `?${query}` : ''}`, { scroll: false })
    },
    [router, pathname, searchParams]
  )

  const resetFilters = useCallback(() => {
    router.push(pathname, { scroll: false })
  }, [router, pathname])

  return { filters, page, setFilters, setPage, resetFilters }
}
