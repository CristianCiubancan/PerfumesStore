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
import { CACHE, STOCK } from '../../config/constants'

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
  // Build WHERE clauses excluding each filter type (for Prisma groupBy queries)
  const whereExcludingGender = buildWhereExcluding(params, 'gender')
  const whereExcludingConcentration = buildWhereExcluding(params, 'concentration')
  const whereExcludingFragranceFamily = buildWhereExcluding(params, 'fragranceFamilyId')
  const whereExcludingLongevity = buildWhereExcluding(params, 'longevityId')
  const whereExcludingSillage = buildWhereExcluding(params, 'sillageId')
  // Note: Season/occasion counts use optimized raw SQL with subqueries (no WHERE clause needed)

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

    // Season counts (many-to-many) - uses optimized raw SQL subquery
    countSeasons(params, 'seasonIds'),

    // Occasion counts (many-to-many) - uses optimized raw SQL subquery
    countOccasions(params, 'occasionIds'),
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
 * Build raw SQL WHERE conditions for product filtering.
 * Used in subqueries to avoid loading all product IDs into memory.
 * Returns SQL condition fragments and parameter values.
 */
function buildRawSQLConditions(
  params: ProductFilterParams,
  excludeField: ExcludeField
): { conditions: string[]; values: unknown[] } {
  const conditions: string[] = ['"deletedAt" IS NULL']
  const values: unknown[] = []
  let paramIndex = 1

  // Brand filter (case-insensitive contains)
  if (params.brand) {
    conditions.push(`"brand" ILIKE $${paramIndex}`)
    values.push(`%${params.brand}%`)
    paramIndex++
  }

  // Gender filter
  if (excludeField !== 'gender' && params.gender) {
    conditions.push(`"gender" = $${paramIndex}::"Gender"`)
    values.push(params.gender)
    paramIndex++
  }

  // Concentration filter
  if (excludeField !== 'concentration' && params.concentration) {
    conditions.push(`"concentration" = $${paramIndex}::"Concentration"`)
    values.push(params.concentration)
    paramIndex++
  }

  // Price range filter
  if (params.minPrice !== undefined) {
    conditions.push(`"priceRON" >= $${paramIndex}`)
    values.push(params.minPrice)
    paramIndex++
  }
  if (params.maxPrice !== undefined) {
    conditions.push(`"priceRON" <= $${paramIndex}`)
    values.push(params.maxPrice)
    paramIndex++
  }

  // Rating range filter
  if (params.minRating !== undefined) {
    conditions.push(`"rating" >= $${paramIndex}`)
    values.push(params.minRating)
    paramIndex++
  }
  if (params.maxRating !== undefined) {
    conditions.push(`"rating" <= $${paramIndex}`)
    values.push(params.maxRating)
    paramIndex++
  }

  // Lookup ID filters
  if (excludeField !== 'fragranceFamilyId' && params.fragranceFamilyId !== undefined) {
    conditions.push(`"fragranceFamilyId" = $${paramIndex}`)
    values.push(params.fragranceFamilyId)
    paramIndex++
  }
  if (excludeField !== 'longevityId' && params.longevityId !== undefined) {
    conditions.push(`"longevityId" = $${paramIndex}`)
    values.push(params.longevityId)
    paramIndex++
  }
  if (excludeField !== 'sillageId' && params.sillageId !== undefined) {
    conditions.push(`"sillageId" = $${paramIndex}`)
    values.push(params.sillageId)
    paramIndex++
  }

  // Stock status filter
  if (params.stockStatus && params.stockStatus !== 'all') {
    switch (params.stockStatus) {
      case 'in_stock':
        conditions.push(`"stock" > ${STOCK.LOW_STOCK_THRESHOLD}`)
        break
      case 'low_stock':
        conditions.push(`"stock" > 0 AND "stock" <= ${STOCK.LOW_STOCK_THRESHOLD}`)
        break
      case 'out_of_stock':
        conditions.push(`"stock" = 0`)
        break
    }
  }

  // Search filter (name, brand, description)
  if (params.search) {
    const searchCondition = `("name" ILIKE $${paramIndex} OR "brand" ILIKE $${paramIndex} OR "description" ILIKE $${paramIndex})`
    conditions.push(searchCondition)
    values.push(`%${params.search}%`)
    paramIndex++
  }

  return { conditions, values }
}

/**
 * Count products for each season (many-to-many relation)
 * Uses a single query with raw SQL subquery to avoid loading all product IDs into memory
 */
async function countSeasons(
  params: ProductFilterParams,
  excludeField: ExcludeField
): Promise<IdFilterCount[]> {
  const { conditions, values } = buildRawSQLConditions(params, excludeField)

  // Build season join condition if not excluded and seasonIds are specified
  let seasonJoinSQL = ''
  if (excludeField !== 'seasonIds' && params.seasonIds && params.seasonIds.length > 0) {
    if (params.seasonMatchMode === 'all') {
      // Product must have ALL specified seasons
      const seasonConditions = params.seasonIds.map((id) =>
        `EXISTS (SELECT 1 FROM "_ProductSeasons" ps WHERE ps."A" = p.id AND ps."B" = ${id})`
      )
      seasonJoinSQL = ` AND ${seasonConditions.join(' AND ')}`
    } else {
      // Product must have ANY of the specified seasons
      seasonJoinSQL = ` AND EXISTS (SELECT 1 FROM "_ProductSeasons" ps WHERE ps."A" = p.id AND ps."B" = ANY(ARRAY[${params.seasonIds.join(',')}]))`
    }
  }

  // Build occasion join condition if not excluded and occasionIds are specified
  let occasionJoinSQL = ''
  if (excludeField !== 'occasionIds' && params.occasionIds && params.occasionIds.length > 0) {
    if (params.occasionMatchMode === 'all') {
      const occasionConditions = params.occasionIds.map((id) =>
        `EXISTS (SELECT 1 FROM "_ProductOccasions" po WHERE po."B" = p.id AND po."A" = ${id})`
      )
      occasionJoinSQL = ` AND ${occasionConditions.join(' AND ')}`
    } else {
      occasionJoinSQL = ` AND EXISTS (SELECT 1 FROM "_ProductOccasions" po WHERE po."B" = p.id AND po."A" = ANY(ARRAY[${params.occasionIds.join(',')}]))`
    }
  }

  const whereClause = conditions.join(' AND ')

  // Single query with subquery - no need to load all IDs into memory
  // In _ProductSeasons: A = Product ID, B = Season ID (Prisma alphabetical ordering)
  const query = `
    SELECT s.id as "seasonId", COUNT(DISTINCT ps."A") as count
    FROM "Season" s
    LEFT JOIN "_ProductSeasons" ps ON ps."B" = s.id
      AND ps."A" IN (
        SELECT p.id FROM "Product" p
        WHERE ${whereClause}${seasonJoinSQL}${occasionJoinSQL}
      )
    GROUP BY s.id
    ORDER BY s.id
  `

  const seasonCounts = await prisma.$queryRawUnsafe<{ seasonId: number; count: bigint }[]>(
    query,
    ...values
  )

  return seasonCounts.map((sc) => ({
    id: sc.seasonId,
    count: Number(sc.count),
  }))
}

/**
 * Count products for each occasion (many-to-many relation)
 * Uses a single query with raw SQL subquery to avoid loading all product IDs into memory
 */
async function countOccasions(
  params: ProductFilterParams,
  excludeField: ExcludeField
): Promise<IdFilterCount[]> {
  const { conditions, values } = buildRawSQLConditions(params, excludeField)

  // Build season join condition if not excluded and seasonIds are specified
  let seasonJoinSQL = ''
  if (excludeField !== 'seasonIds' && params.seasonIds && params.seasonIds.length > 0) {
    if (params.seasonMatchMode === 'all') {
      const seasonConditions = params.seasonIds.map((id) =>
        `EXISTS (SELECT 1 FROM "_ProductSeasons" ps WHERE ps."A" = p.id AND ps."B" = ${id})`
      )
      seasonJoinSQL = ` AND ${seasonConditions.join(' AND ')}`
    } else {
      seasonJoinSQL = ` AND EXISTS (SELECT 1 FROM "_ProductSeasons" ps WHERE ps."A" = p.id AND ps."B" = ANY(ARRAY[${params.seasonIds.join(',')}]))`
    }
  }

  // Build occasion join condition if not excluded and occasionIds are specified
  let occasionJoinSQL = ''
  if (excludeField !== 'occasionIds' && params.occasionIds && params.occasionIds.length > 0) {
    if (params.occasionMatchMode === 'all') {
      const occasionConditions = params.occasionIds.map((id) =>
        `EXISTS (SELECT 1 FROM "_ProductOccasions" po WHERE po."B" = p.id AND po."A" = ${id})`
      )
      occasionJoinSQL = ` AND ${occasionConditions.join(' AND ')}`
    } else {
      occasionJoinSQL = ` AND EXISTS (SELECT 1 FROM "_ProductOccasions" po WHERE po."B" = p.id AND po."A" = ANY(ARRAY[${params.occasionIds.join(',')}]))`
    }
  }

  const whereClause = conditions.join(' AND ')

  // Single query with subquery - no need to load all IDs into memory
  // In _ProductOccasions: A = Occasion ID, B = Product ID (Prisma alphabetical ordering)
  const query = `
    SELECT o.id as "occasionId", COUNT(DISTINCT po."B") as count
    FROM "Occasion" o
    LEFT JOIN "_ProductOccasions" po ON po."A" = o.id
      AND po."B" IN (
        SELECT p.id FROM "Product" p
        WHERE ${whereClause}${seasonJoinSQL}${occasionJoinSQL}
      )
    GROUP BY o.id
    ORDER BY o.id
  `

  const occasionCounts = await prisma.$queryRawUnsafe<{ occasionId: number; count: bigint }[]>(
    query,
    ...values
  )

  return occasionCounts.map((oc) => ({
    id: oc.occasionId,
    count: Number(oc.count),
  }))
}
