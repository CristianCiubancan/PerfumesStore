'use client'

import { useMemo, useCallback, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Search, X, Star } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { MultiSelect } from '@/components/ui/multi-select'
import { MatchModeToggle } from '@/components/ui/match-mode-toggle'
import { Gender, Concentration, FilterOptions, FilterCounts } from '@/types'
import { useCurrencyStore, currencySymbols } from '@/store/currency'
import { TIMING, RATING } from '@/lib/constants'
import { FilterValues } from '@/hooks/use-filter-params'
import { useDebouncedFilters, DebouncedFields } from '@/hooks/use-debounced-filters'

interface ProductFiltersProps {
  filters: FilterValues
  onFiltersChange: (filters: FilterValues) => void
  onReset: () => void
  filterOptions: FilterOptions | null
  isLoadingOptions?: boolean
  filterCounts: FilterCounts | null
}

const GENDERS: Gender[] = ['Men', 'Women', 'Unisex']
const CONCENTRATIONS: Concentration[] = [
  'Eau_de_Cologne',
  'Eau_de_Toilette',
  'Eau_de_Parfum',
  'Parfum',
  'Extrait_de_Parfum',
]

const DEBOUNCE_MS = TIMING.DEBOUNCE_MS

export function ProductFilters({
  filters,
  onFiltersChange,
  onReset,
  filterOptions,
  isLoadingOptions,
  filterCounts,
}: ProductFiltersProps) {
  const t = useTranslations()
  const { currency } = useCurrencyStore()

  // Memoized lookup maps for O(1) count retrieval instead of O(n) array searches
  // Returns undefined if filterCounts not loaded yet, 0 if item not in response (no products match)
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

  // Helper functions using memoized maps - O(1) lookups
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

  // Check if an option should be disabled (count is 0 and not currently selected)
  const isGenderDisabled = useCallback(
    (gender: Gender): boolean => {
      const count = genderCountMap?.get(gender) ?? undefined
      return count === 0 && filters.gender !== gender
    },
    [genderCountMap, filters.gender]
  )

  const isConcentrationDisabled = useCallback(
    (concentration: Concentration): boolean => {
      const count = concentrationCountMap?.get(concentration) ?? undefined
      return count === 0 && filters.concentration !== concentration
    },
    [concentrationCountMap, filters.concentration]
  )

  const isFragranceFamilyDisabled = useCallback(
    (id: number): boolean => {
      const count = fragranceFamilyCountMap?.get(id) ?? undefined
      return count === 0 && filters.fragranceFamilyId !== id
    },
    [fragranceFamilyCountMap, filters.fragranceFamilyId]
  )

  const isLongevityDisabled = useCallback(
    (id: number): boolean => {
      const count = longevityCountMap?.get(id) ?? undefined
      return count === 0 && filters.longevityId !== id
    },
    [longevityCountMap, filters.longevityId]
  )

  const isSillageDisabled = useCallback(
    (id: number): boolean => {
      const count = sillageCountMap?.get(id) ?? undefined
      return count === 0 && filters.sillageId !== id
    },
    [sillageCountMap, filters.sillageId]
  )

  // Extract debounced fields from filters
  const externalDebouncedFields = useMemo<DebouncedFields>(() => ({
    search: filters.search,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    minRating: filters.minRating,
    maxRating: filters.maxRating,
  }), [filters.search, filters.minPrice, filters.maxPrice, filters.minRating, filters.maxRating])

  // Ref to always access latest filters (avoids stale closures in callback)
  const filtersRef = useRef(filters)
  useEffect(() => { filtersRef.current = filters }, [filters])

  // Callback to merge debounced fields back into full filters
  const handleDebouncedUpdate = useCallback((debouncedFields: DebouncedFields) => {
    onFiltersChange({ ...filtersRef.current, ...debouncedFields })
  }, [onFiltersChange])

  // Single debounce hook handles all text inputs - no race conditions
  const [localFields, updateField] = useDebouncedFilters(
    externalDebouncedFields,
    handleDebouncedUpdate,
    DEBOUNCE_MS
  )

  const handleChange = <K extends keyof FilterValues>(
    key: K,
    value: FilterValues[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const hasActiveFilters =
    filters.search ||
    filters.gender ||
    filters.concentration ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.fragranceFamilyId !== null ||
    filters.longevityId !== null ||
    filters.sillageId !== null ||
    filters.seasonIds.length > 0 ||
    filters.occasionIds.length > 0 ||
    filters.minRating ||
    filters.maxRating

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="space-y-2">
        <Label htmlFor="search">{t('common.search')}</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="search"
            placeholder={t('store.searchPlaceholder')}
            value={localFields.search}
            onChange={(e) => updateField('search', e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Separator />

      {/* Sort */}
      <div className="space-y-2">
        <Label>{t('common.sort')}</Label>
        <Select
          value={`${filters.sortBy}-${filters.sortOrder}`}
          onValueChange={(value) => {
            const [sortBy, sortOrder] = value.split('-') as [
              FilterValues['sortBy'],
              FilterValues['sortOrder']
            ]
            onFiltersChange({ ...filters, sortBy, sortOrder })
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest-desc">{t('store.sort.newest')}</SelectItem>
            <SelectItem value="price-asc">{t('store.sort.priceLowHigh')}</SelectItem>
            <SelectItem value="price-desc">{t('store.sort.priceHighLow')}</SelectItem>
            <SelectItem value="name-asc">{t('store.sort.nameAZ')}</SelectItem>
            <SelectItem value="name-desc">{t('store.sort.nameZA')}</SelectItem>
            <SelectItem value="rating-desc">{t('store.sort.ratingHighLow')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Gender */}
      <div className="space-y-2">
        <Label>{t('store.filters.gender')}</Label>
        <Select
          value={filters.gender || 'all'}
          onValueChange={(value) =>
            handleChange('gender', value === 'all' ? '' : (value as Gender))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder={t('store.filters.allGenders')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('store.filters.allGenders')}</SelectItem>
            {GENDERS.map((gender) => {
              const count = getGenderCount(gender)
              const disabled = isGenderDisabled(gender)
              const label = count !== undefined
                ? `${t(`product.gender.${gender}`)} (${count})`
                : t(`product.gender.${gender}`)
              return (
                <SelectItem
                  key={gender}
                  value={gender}
                  disabled={disabled}
                  className={disabled ? 'opacity-50' : ''}
                >
                  {label}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Concentration */}
      <div className="space-y-2">
        <Label>{t('store.filters.concentration')}</Label>
        <Select
          value={filters.concentration || 'all'}
          onValueChange={(value) =>
            handleChange(
              'concentration',
              value === 'all' ? '' : (value as Concentration)
            )
          }
        >
          <SelectTrigger>
            <SelectValue placeholder={t('store.filters.allConcentrations')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t('store.filters.allConcentrations')}
            </SelectItem>
            {CONCENTRATIONS.map((conc) => {
              const count = getConcentrationCount(conc)
              const disabled = isConcentrationDisabled(conc)
              const label = count !== undefined
                ? `${t(`product.concentration.${conc}`)} (${count})`
                : t(`product.concentration.${conc}`)
              return (
                <SelectItem
                  key={conc}
                  value={conc}
                  disabled={disabled}
                  className={disabled ? 'opacity-50' : ''}
                >
                  {label}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Fragrance Family */}
      <div className="space-y-2">
        <Label>{t('store.filters.fragranceFamily')}</Label>
        <Select
          value={filters.fragranceFamilyId?.toString() || 'all'}
          onValueChange={(value) =>
            handleChange('fragranceFamilyId', value === 'all' ? null : parseInt(value, 10))
          }
          disabled={isLoadingOptions || !filterOptions}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('store.filters.allFragranceFamilies')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('store.filters.allFragranceFamilies')}</SelectItem>
            {filterOptions?.fragranceFamilies.map((family) => {
              const count = getFragranceFamilyCount(family.id)
              const disabled = isFragranceFamilyDisabled(family.id)
              const label = count !== undefined
                ? `${t(`product.fragranceFamily.${family.name}`)} (${count})`
                : t(`product.fragranceFamily.${family.name}`)
              return (
                <SelectItem
                  key={family.id}
                  value={family.id.toString()}
                  disabled={disabled}
                  className={disabled ? 'opacity-50' : ''}
                >
                  {label}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Season with Match Mode */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{t('store.filters.season')}</Label>
          <MatchModeToggle
            value={filters.seasonMatchMode}
            onChange={(mode) => handleChange('seasonMatchMode', mode)}
            anyLabel={t('store.filters.matchAny')}
            allLabel={t('store.filters.matchAll')}
          />
        </div>
        <MultiSelect
          options={filterOptions?.seasons.map((s) => {
            const count = getSeasonCount(s.id)
            return {
              value: s.id.toString(),
              label: t(`product.season.${s.name}`),
              count,
              disabled: count === 0 && !filters.seasonIds.includes(s.id),
            }
          }) || []}
          selected={filters.seasonIds.map(String)}
          onChange={(selected) => handleChange('seasonIds', selected.map((id) => parseInt(id, 10)))}
          placeholder={t('store.filters.selectSeasons')}
          disabled={isLoadingOptions || !filterOptions}
          showCounts={!!filterCounts}
        />
      </div>

      {/* Occasion with Match Mode */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{t('store.filters.occasion')}</Label>
          <MatchModeToggle
            value={filters.occasionMatchMode}
            onChange={(mode) => handleChange('occasionMatchMode', mode)}
            anyLabel={t('store.filters.matchAny')}
            allLabel={t('store.filters.matchAll')}
          />
        </div>
        <MultiSelect
          options={filterOptions?.occasions.map((o) => {
            const count = getOccasionCount(o.id)
            return {
              value: o.id.toString(),
              label: t(`product.occasion.${o.name}`),
              count,
              disabled: count === 0 && !filters.occasionIds.includes(o.id),
            }
          }) || []}
          selected={filters.occasionIds.map(String)}
          onChange={(selected) => handleChange('occasionIds', selected.map((id) => parseInt(id, 10)))}
          placeholder={t('store.filters.selectOccasions')}
          disabled={isLoadingOptions || !filterOptions}
          showCounts={!!filterCounts}
        />
      </div>

      <Separator />

      {/* Rating Range */}
      <div className="space-y-2">
        <Label>{t('store.filters.rating')}</Label>
        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
          <Star className="h-4 w-4" />
          <span>0 - 5</span>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder={t('store.filters.min')}
            value={localFields.minRating}
            onChange={(e) => updateField('minRating', e.target.value)}
            min={RATING.MIN}
            max={RATING.MAX}
            step={RATING.STEP}
            className="w-full"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="number"
            placeholder={t('store.filters.max')}
            value={localFields.maxRating}
            onChange={(e) => updateField('maxRating', e.target.value)}
            min={RATING.MIN}
            max={RATING.MAX}
            step={RATING.STEP}
            className="w-full"
          />
        </div>
      </div>

      <Separator />

      {/* Longevity */}
      <div className="space-y-2">
        <Label>{t('store.filters.longevity')}</Label>
        <Select
          value={filters.longevityId?.toString() || 'all'}
          onValueChange={(value) =>
            handleChange('longevityId', value === 'all' ? null : parseInt(value, 10))
          }
          disabled={isLoadingOptions || !filterOptions}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('store.filters.allLongevities')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('store.filters.allLongevities')}</SelectItem>
            {filterOptions?.longevities.map((longevity) => {
              const count = getLongevityCount(longevity.id)
              const disabled = isLongevityDisabled(longevity.id)
              const label = count !== undefined
                ? `${t(`product.longevity.${longevity.name}`)} (${count})`
                : t(`product.longevity.${longevity.name}`)
              return (
                <SelectItem
                  key={longevity.id}
                  value={longevity.id.toString()}
                  disabled={disabled}
                  className={disabled ? 'opacity-50' : ''}
                >
                  {label}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Sillage */}
      <div className="space-y-2">
        <Label>{t('store.filters.sillage')}</Label>
        <Select
          value={filters.sillageId?.toString() || 'all'}
          onValueChange={(value) =>
            handleChange('sillageId', value === 'all' ? null : parseInt(value, 10))
          }
          disabled={isLoadingOptions || !filterOptions}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('store.filters.allSillages')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('store.filters.allSillages')}</SelectItem>
            {filterOptions?.sillages.map((sillage) => {
              const count = getSillageCount(sillage.id)
              const disabled = isSillageDisabled(sillage.id)
              const label = count !== undefined
                ? `${t(`product.sillage.${sillage.name}`)} (${count})`
                : t(`product.sillage.${sillage.name}`)
              return (
                <SelectItem
                  key={sillage.id}
                  value={sillage.id.toString()}
                  disabled={disabled}
                  className={disabled ? 'opacity-50' : ''}
                >
                  {label}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Price Range */}
      <div className="space-y-2">
        <Label>{t('store.filters.priceRange')} ({currencySymbols[currency]})</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder={t('store.filters.min')}
            value={localFields.minPrice}
            onChange={(e) => updateField('minPrice', e.target.value)}
            min={0}
            className="w-full"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="number"
            placeholder={t('store.filters.max')}
            value={localFields.maxPrice}
            onChange={(e) => updateField('maxPrice', e.target.value)}
            min={0}
            className="w-full"
          />
        </div>
      </div>

      {/* Reset Filters */}
      {hasActiveFilters && (
        <>
          <Separator />
          <Button
            variant="outline"
            className="w-full"
            onClick={onReset}
          >
            <X className="mr-2 h-4 w-4" />
            {t('store.filters.clearAll')}
          </Button>
        </>
      )}
    </div>
  )
}
