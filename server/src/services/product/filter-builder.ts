import { Prisma, Gender, Concentration } from '@prisma/client'
import { AppError } from '../../middleware/errorHandler'
import { STOCK } from '../../config/constants'
// Shared type guards for enum validation - synchronized with client
import { isValidGender, isValidConcentration } from '../../../../shared/shared-types'

// NOTE: These type guards are retained for defensive programming in the service layer.
// Primary validation is handled by Zod schemas in /schemas/product.ts (listProductsSchema)
// which validates query parameters before they reach this service.
// These guards provide an additional safety layer for internal service calls.

export interface ProductFilterParams {
  brand?: string
  gender?: string
  concentration?: string
  minPrice?: number
  maxPrice?: number
  search?: string
  fragranceFamilyId?: number
  longevityId?: number
  sillageId?: number
  seasonIds?: number[]
  seasonMatchMode?: 'any' | 'all'
  occasionIds?: number[]
  occasionMatchMode?: 'any' | 'all'
  minRating?: number
  maxRating?: number
  stockStatus?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
}

export function buildBrandFilter(brand?: string): Prisma.ProductWhereInput {
  if (!brand) return {}
  return { brand: { contains: brand, mode: 'insensitive' } }
}

export function buildGenderFilter(gender?: string): Prisma.ProductWhereInput {
  if (!gender) return {}
  if (!isValidGender(gender)) {
    throw new AppError('Invalid gender value', 400, 'INVALID_GENDER')
  }
  return { gender }
}

export function buildConcentrationFilter(
  concentration?: string
): Prisma.ProductWhereInput {
  if (!concentration) return {}
  if (!isValidConcentration(concentration)) {
    throw new AppError('Invalid concentration value', 400, 'INVALID_CONCENTRATION')
  }
  return { concentration }
}

function buildDecimalRangeFilter(
  fieldName: 'priceRON' | 'rating',
  min?: number,
  max?: number
): Prisma.ProductWhereInput {
  if (min === undefined && max === undefined) return {}

  const filter: Prisma.DecimalFilter<'Product'> = {}
  if (min !== undefined) {
    filter.gte = new Prisma.Decimal(min)
  }
  if (max !== undefined) {
    filter.lte = new Prisma.Decimal(max)
  }
  return { [fieldName]: filter }
}

export function buildPriceFilter(
  minPrice?: number,
  maxPrice?: number
): Prisma.ProductWhereInput {
  return buildDecimalRangeFilter('priceRON', minPrice, maxPrice)
}

export function buildSearchFilter(search?: string): Prisma.ProductWhereInput {
  if (!search) return {}
  return {
    OR: [
      { name: { contains: search, mode: 'insensitive' } },
      { brand: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ],
  }
}

export function buildLookupFilters(params: {
  fragranceFamilyId?: number
  longevityId?: number
  sillageId?: number
}): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {}

  if (params.fragranceFamilyId !== undefined) {
    where.fragranceFamilyId = params.fragranceFamilyId
  }
  if (params.longevityId !== undefined) {
    where.longevityId = params.longevityId
  }
  if (params.sillageId !== undefined) {
    where.sillageId = params.sillageId
  }

  return where
}

export function buildSeasonFilter(
  seasonIds?: number[],
  matchMode: 'any' | 'all' = 'any'
): Prisma.ProductWhereInput {
  if (!seasonIds || seasonIds.length === 0) return {}

  if (matchMode === 'all') {
    return {
      AND: seasonIds.map((id) => ({
        seasons: { some: { id } },
      })),
    }
  }

  return { seasons: { some: { id: { in: seasonIds } } } }
}

export function buildOccasionFilter(
  occasionIds?: number[],
  matchMode: 'any' | 'all' = 'any'
): Prisma.ProductWhereInput {
  if (!occasionIds || occasionIds.length === 0) return {}

  if (matchMode === 'all') {
    return {
      AND: occasionIds.map((id) => ({
        occasions: { some: { id } },
      })),
    }
  }

  return { occasions: { some: { id: { in: occasionIds } } } }
}

export function buildRatingFilter(
  minRating?: number,
  maxRating?: number
): Prisma.ProductWhereInput {
  return buildDecimalRangeFilter('rating', minRating, maxRating)
}

export function buildStockStatusFilter(
  stockStatus?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
): Prisma.ProductWhereInput {
  if (!stockStatus || stockStatus === 'all') return {}

  switch (stockStatus) {
    case 'in_stock':
      return { stock: { gt: STOCK.LOW_STOCK_THRESHOLD } }
    case 'low_stock':
      return { stock: { gt: 0, lte: STOCK.LOW_STOCK_THRESHOLD } }
    case 'out_of_stock':
      return { stock: { equals: 0 } }
    default:
      return {}
  }
}

export function buildWhereClause(
  params: ProductFilterParams
): Prisma.ProductWhereInput {
  const filters: Prisma.ProductWhereInput[] = [
    // Exclude soft-deleted products by default
    { deletedAt: null },
    buildBrandFilter(params.brand),
    buildGenderFilter(params.gender),
    buildConcentrationFilter(params.concentration),
    buildPriceFilter(params.minPrice, params.maxPrice),
    buildLookupFilters({
      fragranceFamilyId: params.fragranceFamilyId,
      longevityId: params.longevityId,
      sillageId: params.sillageId,
    }),
    buildRatingFilter(params.minRating, params.maxRating),
    buildStockStatusFilter(params.stockStatus),
  ]

  // Handle search separately (has OR)
  const searchFilter = buildSearchFilter(params.search)

  // Handle many-to-many filters (may have AND)
  const seasonFilter = buildSeasonFilter(params.seasonIds, params.seasonMatchMode)
  const occasionFilter = buildOccasionFilter(
    params.occasionIds,
    params.occasionMatchMode
  )

  // Merge all filters
  const where: Prisma.ProductWhereInput = {}

  // Merge simple filters
  for (const filter of filters) {
    Object.assign(where, filter)
  }

  // Merge search filter (OR clause)
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

type SortBy = 'name' | 'price' | 'rating' | 'newest' | 'stock'
type SortOrder = 'asc' | 'desc'

const SORT_FIELD_MAP: Record<SortBy, keyof Prisma.ProductOrderByWithRelationInput> = {
  name: 'name',
  price: 'priceRON',
  rating: 'rating',
  newest: 'createdAt',
  stock: 'stock',
}

export function buildSortOrder(
  sortBy: SortBy = 'newest',
  sortOrder: SortOrder = 'desc'
): Prisma.ProductOrderByWithRelationInput {
  const field = SORT_FIELD_MAP[sortBy] || 'createdAt'
  return { [field]: sortOrder }
}
