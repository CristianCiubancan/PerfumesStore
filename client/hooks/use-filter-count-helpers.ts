'use client'

import { useMemo, useCallback } from 'react'
import { Gender, Concentration, FilterCounts } from '@/types'
import { FilterValues } from './use-filter-params'

interface FilterCountHelpers {
  getGenderCount: (gender: Gender) => number | undefined
  getConcentrationCount: (concentration: Concentration) => number | undefined
  getFragranceFamilyCount: (id: number) => number | undefined
  getLongevityCount: (id: number) => number | undefined
  getSillageCount: (id: number) => number | undefined
  getSeasonCount: (id: number) => number | undefined
  getOccasionCount: (id: number) => number | undefined
  isGenderDisabled: (gender: Gender) => boolean
  isConcentrationDisabled: (concentration: Concentration) => boolean
  isFragranceFamilyDisabled: (id: number) => boolean
  isLongevityDisabled: (id: number) => boolean
  isSillageDisabled: (id: number) => boolean
}

/**
 * Hook that provides O(1) filter count lookups and disabled state checks.
 * Memoizes count maps from FilterCounts data and provides helper functions.
 */
export function useFilterCountHelpers(
  filterCounts: FilterCounts | null,
  filters: FilterValues
): FilterCountHelpers {
  // Memoized lookup maps for O(1) count retrieval
  const genderCountMap = useMemo(() => {
    if (!filterCounts) return null
    return new Map(filterCounts.genders.map((g) => [g.value, g.count]))
  }, [filterCounts])

  const concentrationCountMap = useMemo(() => {
    if (!filterCounts) return null
    return new Map(filterCounts.concentrations.map((c) => [c.value, c.count]))
  }, [filterCounts])

  const fragranceFamilyCountMap = useMemo(() => {
    if (!filterCounts) return null
    return new Map(filterCounts.fragranceFamilies.map((f) => [f.id, f.count]))
  }, [filterCounts])

  const longevityCountMap = useMemo(() => {
    if (!filterCounts) return null
    return new Map(filterCounts.longevities.map((l) => [l.id, l.count]))
  }, [filterCounts])

  const sillageCountMap = useMemo(() => {
    if (!filterCounts) return null
    return new Map(filterCounts.sillages.map((s) => [s.id, s.count]))
  }, [filterCounts])

  const seasonCountMap = useMemo(() => {
    if (!filterCounts) return null
    return new Map(filterCounts.seasons.map((s) => [s.id, s.count]))
  }, [filterCounts])

  const occasionCountMap = useMemo(() => {
    if (!filterCounts) return null
    return new Map(filterCounts.occasions.map((o) => [o.id, o.count]))
  }, [filterCounts])

  // Count getter functions - O(1) lookups
  const getGenderCount = useCallback(
    (gender: Gender): number | undefined =>
      genderCountMap ? (genderCountMap.get(gender) ?? 0) : undefined,
    [genderCountMap]
  )

  const getConcentrationCount = useCallback(
    (concentration: Concentration): number | undefined =>
      concentrationCountMap ? (concentrationCountMap.get(concentration) ?? 0) : undefined,
    [concentrationCountMap]
  )

  const getFragranceFamilyCount = useCallback(
    (id: number): number | undefined =>
      fragranceFamilyCountMap ? (fragranceFamilyCountMap.get(id) ?? 0) : undefined,
    [fragranceFamilyCountMap]
  )

  const getLongevityCount = useCallback(
    (id: number): number | undefined =>
      longevityCountMap ? (longevityCountMap.get(id) ?? 0) : undefined,
    [longevityCountMap]
  )

  const getSillageCount = useCallback(
    (id: number): number | undefined =>
      sillageCountMap ? (sillageCountMap.get(id) ?? 0) : undefined,
    [sillageCountMap]
  )

  const getSeasonCount = useCallback(
    (id: number): number | undefined =>
      seasonCountMap ? (seasonCountMap.get(id) ?? 0) : undefined,
    [seasonCountMap]
  )

  const getOccasionCount = useCallback(
    (id: number): number | undefined =>
      occasionCountMap ? (occasionCountMap.get(id) ?? 0) : undefined,
    [occasionCountMap]
  )

  // Disabled check functions - disabled if count is 0 and not currently selected
  const isGenderDisabled = useCallback(
    (gender: Gender): boolean => {
      if (!genderCountMap) return false
      const count = genderCountMap.get(gender) ?? 0
      return count === 0 && filters.gender !== gender
    },
    [genderCountMap, filters.gender]
  )

  const isConcentrationDisabled = useCallback(
    (concentration: Concentration): boolean => {
      if (!concentrationCountMap) return false
      const count = concentrationCountMap.get(concentration) ?? 0
      return count === 0 && filters.concentration !== concentration
    },
    [concentrationCountMap, filters.concentration]
  )

  const isFragranceFamilyDisabled = useCallback(
    (id: number): boolean => {
      if (!fragranceFamilyCountMap) return false
      const count = fragranceFamilyCountMap.get(id) ?? 0
      return count === 0 && filters.fragranceFamilyId !== id
    },
    [fragranceFamilyCountMap, filters.fragranceFamilyId]
  )

  const isLongevityDisabled = useCallback(
    (id: number): boolean => {
      if (!longevityCountMap) return false
      const count = longevityCountMap.get(id) ?? 0
      return count === 0 && filters.longevityId !== id
    },
    [longevityCountMap, filters.longevityId]
  )

  const isSillageDisabled = useCallback(
    (id: number): boolean => {
      if (!sillageCountMap) return false
      const count = sillageCountMap.get(id) ?? 0
      return count === 0 && filters.sillageId !== id
    },
    [sillageCountMap, filters.sillageId]
  )

  return {
    getGenderCount,
    getConcentrationCount,
    getFragranceFamilyCount,
    getLongevityCount,
    getSillageCount,
    getSeasonCount,
    getOccasionCount,
    isGenderDisabled,
    isConcentrationDisabled,
    isFragranceFamilyDisabled,
    isLongevityDisabled,
    isSillageDisabled,
  }
}
