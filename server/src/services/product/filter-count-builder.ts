import { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import {
  buildBrandFilter,
  buildGenderFilter,
  buildConcentrationFilter,
  buildPriceFilter,
  buildSearchFilter,
  buildLookupFilters,
  buildSeasonFilter,
  buildOccasionFilter,
  buildRatingFilter,
  buildStockStatusFilter,
  ProductFilterParams,
} from './filter-builder'
import { CACHE } from '../../config/constants'

// Types for filter counts response
export interface EnumFilterCount {
  value: string
  count: number
}

export interface IdFilterCount {
  id: number
  count: number
}

// Re-export cache duration for use in controller
export const FILTER_COUNTS_CACHE_SECONDS = CACHE.FILTER_COUNTS_MAX_AGE_SECONDS

export interface FilterCounts {
  genders: EnumFilterCount[]
  concentrations: EnumFilterCount[]
  fragranceFamilies: IdFilterCount[]
  longevities: IdFilterCount[]
  sillages: IdFilterCount[]
  seasons: IdFilterCount[]
  occasions: IdFilterCount[]
}

type ExcludeField =
  | 'gender'
  | 'concentration'
  | 'fragranceFamilyId'
  | 'longevityId'
  | 'sillageId'
  | 'seasonIds'
  | 'occasionIds'

/**
 * Build WHERE clause excluding a specific filter field
 * Used to count how many products would match if that filter were changed
 */
export function buildWhereExcluding(
  params: ProductFilterParams,
  excludeField: ExcludeField
): Prisma.ProductWhereInput {
  const filters: Prisma.ProductWhereInput[] = [
    { deletedAt: null },
    buildBrandFilter(params.brand),
    buildPriceFilter(params.minPrice, params.maxPrice),
    buildRatingFilter(params.minRating, params.maxRating),
    buildStockStatusFilter(params.stockStatus),
  ]

  // Conditionally add filters based on what we're excluding
  if (excludeField !== 'gender') {
    filters.push(buildGenderFilter(params.gender))
  }
  if (excludeField !== 'concentration') {
    filters.push(buildConcentrationFilter(params.concentration))
  }

  // Lookup filters (excluding the specified one)
  const lookupParams: {
    fragranceFamilyId?: number
    longevityId?: number
    sillageId?: number
  } = {}

  if (excludeField !== 'fragranceFamilyId' && params.fragranceFamilyId !== undefined) {
    lookupParams.fragranceFamilyId = params.fragranceFamilyId
  }
  if (excludeField !== 'longevityId' && params.longevityId !== undefined) {
    lookupParams.longevityId = params.longevityId
  }
  if (excludeField !== 'sillageId' && params.sillageId !== undefined) {
    lookupParams.sillageId = params.sillageId
  }
  filters.push(buildLookupFilters(lookupParams))

  // Handle search separately (has OR)
  const searchFilter = buildSearchFilter(params.search)

  // Handle many-to-many filters (excluding the specified one)
  const seasonFilter =
    excludeField !== 'seasonIds'
      ? buildSeasonFilter(params.seasonIds, params.seasonMatchMode)
      : {}
  const occasionFilter =
    excludeField !== 'occasionIds'
      ? buildOccasionFilter(params.occasionIds, params.occasionMatchMode)
      : {}

  // Merge all filters
  const where: Prisma.ProductWhereInput = {}

  for (const filter of filters) {
    Object.assign(where, filter)
  }

  if (searchFilter.OR) {
    where.OR = searchFilter.OR
  }

  // Merge AND clauses from season and occasion filters
  const andClauses: Prisma.ProductWhereInput[] = []
  if (seasonFilter.AND) {
    andClauses.push(...(seasonFilter.AND as Prisma.ProductWhereInput[]))
  } else if (seasonFilter.seasons) {
    where.seasons = seasonFilter.seasons
  }

  if (occasionFilter.AND) {
    andClauses.push(...(occasionFilter.AND as Prisma.ProductWhereInput[]))
  } else if (occasionFilter.occasions) {
    where.occasions = occasionFilter.occasions
  }

  if (andClauses.length > 0) {
    where.AND = andClauses
  }

  return where
}

/**
 * Get counts for all filter options based on current filter selection
 * Each count represents how many products would match if that option were selected
 */
export async function getFilterCounts(
  params: ProductFilterParams
): Promise<FilterCounts> {
  // Build WHERE clauses excluding each filter type
  const whereExcludingGender = buildWhereExcluding(params, 'gender')
  const whereExcludingConcentration = buildWhereExcluding(params, 'concentration')
  const whereExcludingFragranceFamily = buildWhereExcluding(params, 'fragranceFamilyId')
  const whereExcludingLongevity = buildWhereExcluding(params, 'longevityId')
  const whereExcludingSillage = buildWhereExcluding(params, 'sillageId')
  const whereExcludingSeason = buildWhereExcluding(params, 'seasonIds')
  const whereExcludingOccasion = buildWhereExcluding(params, 'occasionIds')

  // Run all count queries in parallel
  const [
    genderCounts,
    concentrationCounts,
    fragranceFamilyCounts,
    longevityCounts,
    sillageCounts,
    seasonCounts,
    occasionCounts,
  ] = await Promise.all([
    // Gender counts
    prisma.product.groupBy({
      by: ['gender'],
      where: whereExcludingGender,
      _count: { id: true },
    }),

    // Concentration counts
    prisma.product.groupBy({
      by: ['concentration'],
      where: whereExcludingConcentration,
      _count: { id: true },
    }),

    // Fragrance family counts
    prisma.product.groupBy({
      by: ['fragranceFamilyId'],
      where: whereExcludingFragranceFamily,
      _count: { id: true },
    }),

    // Longevity counts
    prisma.product.groupBy({
      by: ['longevityId'],
      where: whereExcludingLongevity,
      _count: { id: true },
    }),

    // Sillage counts
    prisma.product.groupBy({
      by: ['sillageId'],
      where: whereExcludingSillage,
      _count: { id: true },
    }),

    // Season counts (many-to-many)
    countSeasons(whereExcludingSeason),

    // Occasion counts (many-to-many)
    countOccasions(whereExcludingOccasion),
  ])

  return {
    genders: genderCounts.map((g) => ({
      value: g.gender,
      count: g._count.id,
    })),
    concentrations: concentrationCounts.map((c) => ({
      value: c.concentration,
      count: c._count.id,
    })),
    // Filter out null fragranceFamilyId values before mapping
    fragranceFamilies: fragranceFamilyCounts
      .filter((f): f is typeof f & { fragranceFamilyId: number } => f.fragranceFamilyId !== null)
      .map((f) => ({
        id: f.fragranceFamilyId,
        count: f._count.id,
      })),
    // Filter out null longevityId values before mapping
    longevities: longevityCounts
      .filter((l): l is typeof l & { longevityId: number } => l.longevityId !== null)
      .map((l) => ({
        id: l.longevityId,
        count: l._count.id,
      })),
    // Filter out null sillageId values before mapping
    sillages: sillageCounts
      .filter((s): s is typeof s & { sillageId: number } => s.sillageId !== null)
      .map((s) => ({
        id: s.sillageId,
        count: s._count.id,
      })),
    seasons: seasonCounts,
    occasions: occasionCounts,
  }
}

/**
 * Count products for each season (many-to-many relation)
 * Uses a single query with raw SQL aggregation to avoid N+1 problem
 */
async function countSeasons(
  baseWhere: Prisma.ProductWhereInput
): Promise<IdFilterCount[]> {
  // Get matching product IDs first (respecting all filters)
  const matchingProducts = await prisma.product.findMany({
    where: baseWhere,
    select: { id: true },
  })

  if (matchingProducts.length === 0) {
    // Return all seasons with 0 count
    const allSeasons = await prisma.season.findMany({ select: { id: true } })
    return allSeasons.map((s) => ({ id: s.id, count: 0 }))
  }

  const productIds = matchingProducts.map((p) => p.id)

  // Single aggregation query: count products per season
  const seasonCounts = await prisma.$queryRaw<{ seasonId: number; count: bigint }[]>`
    SELECT "A" as "seasonId", COUNT(DISTINCT "B") as count
    FROM "_ProductSeasons"
    WHERE "B" = ANY(${productIds}::int[])
    GROUP BY "A"
  `

  // Get all seasons to ensure we return counts for all (even 0)
  const allSeasons = await prisma.season.findMany({ select: { id: true } })
  const countsMap = new Map(seasonCounts.map((sc) => [sc.seasonId, Number(sc.count)]))

  return allSeasons.map((s) => ({
    id: s.id,
    count: countsMap.get(s.id) ?? 0,
  }))
}

/**
 * Count products for each occasion (many-to-many relation)
 * Uses a single query with raw SQL aggregation to avoid N+1 problem
 */
async function countOccasions(
  baseWhere: Prisma.ProductWhereInput
): Promise<IdFilterCount[]> {
  // Get matching product IDs first (respecting all filters)
  const matchingProducts = await prisma.product.findMany({
    where: baseWhere,
    select: { id: true },
  })

  if (matchingProducts.length === 0) {
    // Return all occasions with 0 count
    const allOccasions = await prisma.occasion.findMany({ select: { id: true } })
    return allOccasions.map((o) => ({ id: o.id, count: 0 }))
  }

  const productIds = matchingProducts.map((p) => p.id)

  // Single aggregation query: count products per occasion
  const occasionCounts = await prisma.$queryRaw<{ occasionId: number; count: bigint }[]>`
    SELECT "A" as "occasionId", COUNT(DISTINCT "B") as count
    FROM "_ProductOccasions"
    WHERE "B" = ANY(${productIds}::int[])
    GROUP BY "A"
  `

  // Get all occasions to ensure we return counts for all (even 0)
  const allOccasions = await prisma.occasion.findMany({ select: { id: true } })
  const countsMap = new Map(occasionCounts.map((oc) => [oc.occasionId, Number(oc.count)]))

  return allOccasions.map((o) => ({
    id: o.id,
    count: countsMap.get(o.id) ?? 0,
  }))
}
