import { Prisma } from '@prisma/client'
import { AppError } from '../../../middleware/errorHandler'
import { STOCK } from '../../../config/constants'
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
  buildWhereClause,
  buildSortOrder,
  ProductFilterParams,
} from '../filter-builder'

describe('ProductFilterBuilder', () => {
  describe('buildBrandFilter', () => {
    it('should return empty object when brand is undefined', () => {
      const result = buildBrandFilter(undefined)
      expect(result).toEqual({})
    })

    it('should return empty object when brand is empty string', () => {
      const result = buildBrandFilter('')
      expect(result).toEqual({})
    })

    it('should return case-insensitive contains filter for brand', () => {
      const result = buildBrandFilter('Chanel')
      expect(result).toEqual({
        brand: { contains: 'Chanel', mode: 'insensitive' },
      })
    })

    it('should handle partial brand names', () => {
      const result = buildBrandFilter('Cha')
      expect(result).toEqual({
        brand: { contains: 'Cha', mode: 'insensitive' },
      })
    })
  })

  describe('buildGenderFilter', () => {
    it('should return empty object when gender is undefined', () => {
      const result = buildGenderFilter(undefined)
      expect(result).toEqual({})
    })

    it('should return empty object when gender is empty string', () => {
      const result = buildGenderFilter('')
      expect(result).toEqual({})
    })

    it('should return filter for valid gender "Men"', () => {
      const result = buildGenderFilter('Men')
      expect(result).toEqual({ gender: 'Men' })
    })

    it('should return filter for valid gender "Women"', () => {
      const result = buildGenderFilter('Women')
      expect(result).toEqual({ gender: 'Women' })
    })

    it('should return filter for valid gender "Unisex"', () => {
      const result = buildGenderFilter('Unisex')
      expect(result).toEqual({ gender: 'Unisex' })
    })

    it('should throw AppError for invalid gender', () => {
      expect(() => buildGenderFilter('Invalid')).toThrow(AppError)
      expect(() => buildGenderFilter('Invalid')).toThrow('Invalid gender value')
    })

    it('should throw AppError with correct code for invalid gender', () => {
      try {
        buildGenderFilter('male')
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).statusCode).toBe(400)
        expect((error as AppError).code).toBe('INVALID_GENDER')
      }
    })
  })

  describe('buildConcentrationFilter', () => {
    it('should return empty object when concentration is undefined', () => {
      const result = buildConcentrationFilter(undefined)
      expect(result).toEqual({})
    })

    it('should return empty object when concentration is empty string', () => {
      const result = buildConcentrationFilter('')
      expect(result).toEqual({})
    })

    it('should return filter for valid concentration "Eau_de_Cologne"', () => {
      const result = buildConcentrationFilter('Eau_de_Cologne')
      expect(result).toEqual({ concentration: 'Eau_de_Cologne' })
    })

    it('should return filter for valid concentration "Eau_de_Toilette"', () => {
      const result = buildConcentrationFilter('Eau_de_Toilette')
      expect(result).toEqual({ concentration: 'Eau_de_Toilette' })
    })

    it('should return filter for valid concentration "Eau_de_Parfum"', () => {
      const result = buildConcentrationFilter('Eau_de_Parfum')
      expect(result).toEqual({ concentration: 'Eau_de_Parfum' })
    })

    it('should return filter for valid concentration "Parfum"', () => {
      const result = buildConcentrationFilter('Parfum')
      expect(result).toEqual({ concentration: 'Parfum' })
    })

    it('should return filter for valid concentration "Extrait_de_Parfum"', () => {
      const result = buildConcentrationFilter('Extrait_de_Parfum')
      expect(result).toEqual({ concentration: 'Extrait_de_Parfum' })
    })

    it('should throw AppError for invalid concentration', () => {
      expect(() => buildConcentrationFilter('Invalid')).toThrow(AppError)
      expect(() => buildConcentrationFilter('Invalid')).toThrow(
        'Invalid concentration value'
      )
    })

    it('should throw AppError with correct code for invalid concentration', () => {
      try {
        buildConcentrationFilter('perfume')
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).statusCode).toBe(400)
        expect((error as AppError).code).toBe('INVALID_CONCENTRATION')
      }
    })
  })

  describe('buildPriceFilter', () => {
    it('should return empty object when both min and max are undefined', () => {
      const result = buildPriceFilter(undefined, undefined)
      expect(result).toEqual({})
    })

    it('should return gte filter when only minPrice is provided', () => {
      const result = buildPriceFilter(100, undefined)
      expect(result).toHaveProperty('priceRON')
      expect(result.priceRON).toEqual({
        gte: expect.any(Prisma.Decimal),
      })
      expect((result.priceRON as Prisma.DecimalFilter).gte?.toString()).toBe(
        '100'
      )
    })

    it('should return lte filter when only maxPrice is provided', () => {
      const result = buildPriceFilter(undefined, 500)
      expect(result).toHaveProperty('priceRON')
      expect(result.priceRON).toEqual({
        lte: expect.any(Prisma.Decimal),
      })
      expect((result.priceRON as Prisma.DecimalFilter).lte?.toString()).toBe(
        '500'
      )
    })

    it('should return gte and lte filter when both minPrice and maxPrice are provided', () => {
      const result = buildPriceFilter(100, 500)
      expect(result).toHaveProperty('priceRON')
      const priceFilter = result.priceRON as Prisma.DecimalFilter
      expect(priceFilter.gte?.toString()).toBe('100')
      expect(priceFilter.lte?.toString()).toBe('500')
    })

    it('should handle zero as minPrice', () => {
      const result = buildPriceFilter(0, undefined)
      expect(result).toHaveProperty('priceRON')
      expect(
        (result.priceRON as Prisma.DecimalFilter).gte?.toString()
      ).toBe('0')
    })

    it('should handle decimal prices', () => {
      const result = buildPriceFilter(99.99, 199.99)
      expect(result).toHaveProperty('priceRON')
      const priceFilter = result.priceRON as Prisma.DecimalFilter
      expect(priceFilter.gte?.toString()).toBe('99.99')
      expect(priceFilter.lte?.toString()).toBe('199.99')
    })
  })

  describe('buildSearchFilter', () => {
    it('should return empty object when search is undefined', () => {
      const result = buildSearchFilter(undefined)
      expect(result).toEqual({})
    })

    it('should return empty object when search is empty string', () => {
      const result = buildSearchFilter('')
      expect(result).toEqual({})
    })

    it('should return OR clause searching name, brand, and description', () => {
      const result = buildSearchFilter('rose')
      expect(result).toEqual({
        OR: [
          { name: { contains: 'rose', mode: 'insensitive' } },
          { brand: { contains: 'rose', mode: 'insensitive' } },
          { description: { contains: 'rose', mode: 'insensitive' } },
        ],
      })
    })

    it('should handle search with spaces', () => {
      const result = buildSearchFilter('rose water')
      expect(result).toEqual({
        OR: [
          { name: { contains: 'rose water', mode: 'insensitive' } },
          { brand: { contains: 'rose water', mode: 'insensitive' } },
          { description: { contains: 'rose water', mode: 'insensitive' } },
        ],
      })
    })
  })

  describe('buildLookupFilters', () => {
    it('should return empty object when all params are undefined', () => {
      const result = buildLookupFilters({})
      expect(result).toEqual({})
    })

    it('should return fragranceFamilyId filter when provided', () => {
      const result = buildLookupFilters({ fragranceFamilyId: 1 })
      expect(result).toEqual({ fragranceFamilyId: 1 })
    })

    it('should return longevityId filter when provided', () => {
      const result = buildLookupFilters({ longevityId: 2 })
      expect(result).toEqual({ longevityId: 2 })
    })

    it('should return sillageId filter when provided', () => {
      const result = buildLookupFilters({ sillageId: 3 })
      expect(result).toEqual({ sillageId: 3 })
    })

    it('should return all lookup filters when all are provided', () => {
      const result = buildLookupFilters({
        fragranceFamilyId: 1,
        longevityId: 2,
        sillageId: 3,
      })
      expect(result).toEqual({
        fragranceFamilyId: 1,
        longevityId: 2,
        sillageId: 3,
      })
    })

    it('should return only provided filters when some are undefined', () => {
      const result = buildLookupFilters({
        fragranceFamilyId: 1,
        longevityId: undefined,
        sillageId: 3,
      })
      expect(result).toEqual({
        fragranceFamilyId: 1,
        sillageId: 3,
      })
      expect(result).not.toHaveProperty('longevityId')
    })
  })

  describe('buildSeasonFilter', () => {
    it('should return empty object when seasonIds is undefined', () => {
      const result = buildSeasonFilter(undefined)
      expect(result).toEqual({})
    })

    it('should return empty object when seasonIds is empty array', () => {
      const result = buildSeasonFilter([])
      expect(result).toEqual({})
    })

    it('should return "some in" filter for any match mode (default)', () => {
      const result = buildSeasonFilter([1, 2])
      expect(result).toEqual({
        seasons: { some: { id: { in: [1, 2] } } },
      })
    })

    it('should return "some in" filter for explicit any match mode', () => {
      const result = buildSeasonFilter([1, 2, 3], 'any')
      expect(result).toEqual({
        seasons: { some: { id: { in: [1, 2, 3] } } },
      })
    })

    it('should return AND clause with multiple "some" filters for all match mode', () => {
      const result = buildSeasonFilter([1, 2], 'all')
      expect(result).toEqual({
        AND: [{ seasons: { some: { id: 1 } } }, { seasons: { some: { id: 2 } } }],
      })
    })

    it('should handle single seasonId with any match mode', () => {
      const result = buildSeasonFilter([1], 'any')
      expect(result).toEqual({
        seasons: { some: { id: { in: [1] } } },
      })
    })

    it('should handle single seasonId with all match mode', () => {
      const result = buildSeasonFilter([1], 'all')
      expect(result).toEqual({
        AND: [{ seasons: { some: { id: 1 } } }],
      })
    })
  })

  describe('buildOccasionFilter', () => {
    it('should return empty object when occasionIds is undefined', () => {
      const result = buildOccasionFilter(undefined)
      expect(result).toEqual({})
    })

    it('should return empty object when occasionIds is empty array', () => {
      const result = buildOccasionFilter([])
      expect(result).toEqual({})
    })

    it('should return "some in" filter for any match mode (default)', () => {
      const result = buildOccasionFilter([1, 2])
      expect(result).toEqual({
        occasions: { some: { id: { in: [1, 2] } } },
      })
    })

    it('should return "some in" filter for explicit any match mode', () => {
      const result = buildOccasionFilter([1, 2, 3], 'any')
      expect(result).toEqual({
        occasions: { some: { id: { in: [1, 2, 3] } } },
      })
    })

    it('should return AND clause with multiple "some" filters for all match mode', () => {
      const result = buildOccasionFilter([1, 2], 'all')
      expect(result).toEqual({
        AND: [
          { occasions: { some: { id: 1 } } },
          { occasions: { some: { id: 2 } } },
        ],
      })
    })

    it('should handle single occasionId with any match mode', () => {
      const result = buildOccasionFilter([1], 'any')
      expect(result).toEqual({
        occasions: { some: { id: { in: [1] } } },
      })
    })

    it('should handle single occasionId with all match mode', () => {
      const result = buildOccasionFilter([1], 'all')
      expect(result).toEqual({
        AND: [{ occasions: { some: { id: 1 } } }],
      })
    })
  })

  describe('buildRatingFilter', () => {
    it('should return empty object when both min and max are undefined', () => {
      const result = buildRatingFilter(undefined, undefined)
      expect(result).toEqual({})
    })

    it('should return gte filter when only minRating is provided', () => {
      const result = buildRatingFilter(3.5, undefined)
      expect(result).toHaveProperty('rating')
      expect(result.rating).toEqual({
        gte: expect.any(Prisma.Decimal),
      })
      expect((result.rating as Prisma.DecimalFilter).gte?.toString()).toBe(
        '3.5'
      )
    })

    it('should return lte filter when only maxRating is provided', () => {
      const result = buildRatingFilter(undefined, 4.5)
      expect(result).toHaveProperty('rating')
      expect(result.rating).toEqual({
        lte: expect.any(Prisma.Decimal),
      })
      expect((result.rating as Prisma.DecimalFilter).lte?.toString()).toBe(
        '4.5'
      )
    })

    it('should return gte and lte filter when both minRating and maxRating are provided', () => {
      const result = buildRatingFilter(3.0, 5.0)
      expect(result).toHaveProperty('rating')
      const ratingFilter = result.rating as Prisma.DecimalFilter
      expect(ratingFilter.gte?.toString()).toBe('3')
      expect(ratingFilter.lte?.toString()).toBe('5')
    })

    it('should handle zero as minRating', () => {
      const result = buildRatingFilter(0, undefined)
      expect(result).toHaveProperty('rating')
      expect((result.rating as Prisma.DecimalFilter).gte?.toString()).toBe('0')
    })
  })

  describe('buildStockStatusFilter', () => {
    it('should return empty object when stockStatus is undefined', () => {
      const result = buildStockStatusFilter(undefined)
      expect(result).toEqual({})
    })

    it('should return empty object when stockStatus is "all"', () => {
      const result = buildStockStatusFilter('all')
      expect(result).toEqual({})
    })

    it('should return gt threshold filter for in_stock', () => {
      const result = buildStockStatusFilter('in_stock')
      expect(result).toEqual({
        stock: { gt: STOCK.LOW_STOCK_THRESHOLD },
      })
    })

    it('should return gt 0 and lte threshold filter for low_stock', () => {
      const result = buildStockStatusFilter('low_stock')
      expect(result).toEqual({
        stock: { gt: 0, lte: STOCK.LOW_STOCK_THRESHOLD },
      })
    })

    it('should return equals 0 filter for out_of_stock', () => {
      const result = buildStockStatusFilter('out_of_stock')
      expect(result).toEqual({
        stock: { equals: 0 },
      })
    })
  })

  describe('buildWhereClause', () => {
    it('should return deletedAt null for empty params (soft delete filter)', () => {
      const result = buildWhereClause({})
      expect(result).toEqual({ deletedAt: null })
    })

    it('should combine multiple simple filters with deletedAt null', () => {
      const params: ProductFilterParams = {
        brand: 'Chanel',
        gender: 'Women',
        concentration: 'Eau_de_Parfum',
      }
      const result = buildWhereClause(params)

      expect(result).toEqual({
        deletedAt: null,
        brand: { contains: 'Chanel', mode: 'insensitive' },
        gender: 'Women',
        concentration: 'Eau_de_Parfum',
      })
    })

    it('should include price filter with decimal fields', () => {
      const params: ProductFilterParams = {
        minPrice: 100,
        maxPrice: 500,
      }
      const result = buildWhereClause(params)

      expect(result).toHaveProperty('priceRON')
      const priceFilter = result.priceRON as Prisma.DecimalFilter
      expect(priceFilter.gte?.toString()).toBe('100')
      expect(priceFilter.lte?.toString()).toBe('500')
    })

    it('should include lookup filters with deletedAt null', () => {
      const params: ProductFilterParams = {
        fragranceFamilyId: 1,
        longevityId: 2,
        sillageId: 3,
      }
      const result = buildWhereClause(params)

      expect(result).toEqual({
        deletedAt: null,
        fragranceFamilyId: 1,
        longevityId: 2,
        sillageId: 3,
      })
    })

    it('should include search OR clause', () => {
      const params: ProductFilterParams = {
        search: 'rose',
      }
      const result = buildWhereClause(params)

      expect(result.OR).toEqual([
        { name: { contains: 'rose', mode: 'insensitive' } },
        { brand: { contains: 'rose', mode: 'insensitive' } },
        { description: { contains: 'rose', mode: 'insensitive' } },
      ])
    })

    it('should include season filter with any mode as direct filter', () => {
      const params: ProductFilterParams = {
        seasonIds: [1, 2],
        seasonMatchMode: 'any',
      }
      const result = buildWhereClause(params)

      expect(result.seasons).toEqual({ some: { id: { in: [1, 2] } } })
    })

    it('should include season filter with all mode in AND clause', () => {
      const params: ProductFilterParams = {
        seasonIds: [1, 2],
        seasonMatchMode: 'all',
      }
      const result = buildWhereClause(params)

      expect(result.AND).toEqual([
        { seasons: { some: { id: 1 } } },
        { seasons: { some: { id: 2 } } },
      ])
    })

    it('should include occasion filter with any mode as direct filter', () => {
      const params: ProductFilterParams = {
        occasionIds: [1, 2],
        occasionMatchMode: 'any',
      }
      const result = buildWhereClause(params)

      expect(result.occasions).toEqual({ some: { id: { in: [1, 2] } } })
    })

    it('should include occasion filter with all mode in AND clause', () => {
      const params: ProductFilterParams = {
        occasionIds: [1, 2],
        occasionMatchMode: 'all',
      }
      const result = buildWhereClause(params)

      expect(result.AND).toEqual([
        { occasions: { some: { id: 1 } } },
        { occasions: { some: { id: 2 } } },
      ])
    })

    it('should combine season and occasion filters with all mode in same AND clause', () => {
      const params: ProductFilterParams = {
        seasonIds: [1],
        seasonMatchMode: 'all',
        occasionIds: [2],
        occasionMatchMode: 'all',
      }
      const result = buildWhereClause(params)

      expect(result.AND).toEqual([
        { seasons: { some: { id: 1 } } },
        { occasions: { some: { id: 2 } } },
      ])
    })

    it('should include rating filter', () => {
      const params: ProductFilterParams = {
        minRating: 4.0,
        maxRating: 5.0,
      }
      const result = buildWhereClause(params)

      expect(result).toHaveProperty('rating')
      const ratingFilter = result.rating as Prisma.DecimalFilter
      expect(ratingFilter.gte?.toString()).toBe('4')
      expect(ratingFilter.lte?.toString()).toBe('5')
    })

    it('should include stock status filter', () => {
      const params: ProductFilterParams = {
        stockStatus: 'in_stock',
      }
      const result = buildWhereClause(params)

      expect(result.stock).toEqual({ gt: STOCK.LOW_STOCK_THRESHOLD })
    })

    it('should combine all filter types together', () => {
      const params: ProductFilterParams = {
        brand: 'Dior',
        gender: 'Unisex',
        concentration: 'Parfum',
        minPrice: 200,
        maxPrice: 1000,
        search: 'oud',
        fragranceFamilyId: 5,
        longevityId: 3,
        sillageId: 2,
        seasonIds: [1, 2],
        seasonMatchMode: 'any',
        occasionIds: [3, 4],
        occasionMatchMode: 'all',
        minRating: 4.0,
        stockStatus: 'in_stock',
      }
      const result = buildWhereClause(params)

      // Simple filters
      expect(result.brand).toEqual({ contains: 'Dior', mode: 'insensitive' })
      expect(result.gender).toBe('Unisex')
      expect(result.concentration).toBe('Parfum')

      // Decimal filters
      expect(result).toHaveProperty('priceRON')
      expect(result).toHaveProperty('rating')

      // Lookup filters
      expect(result.fragranceFamilyId).toBe(5)
      expect(result.longevityId).toBe(3)
      expect(result.sillageId).toBe(2)

      // Search OR clause
      expect(result.OR).toBeDefined()

      // Season filter (any mode - direct)
      expect(result.seasons).toEqual({ some: { id: { in: [1, 2] } } })

      // Occasion filter (all mode - in AND)
      expect(result.AND).toEqual([
        { occasions: { some: { id: 3 } } },
        { occasions: { some: { id: 4 } } },
      ])

      // Stock filter
      expect(result.stock).toEqual({ gt: STOCK.LOW_STOCK_THRESHOLD })
    })

    it('should throw error for invalid gender in combined filters', () => {
      const params: ProductFilterParams = {
        brand: 'Test',
        gender: 'InvalidGender',
      }
      expect(() => buildWhereClause(params)).toThrow(AppError)
    })

    it('should throw error for invalid concentration in combined filters', () => {
      const params: ProductFilterParams = {
        brand: 'Test',
        concentration: 'InvalidConcentration',
      }
      expect(() => buildWhereClause(params)).toThrow(AppError)
    })
  })

  describe('buildSortOrder', () => {
    it('should return default sort (newest desc) when no params provided', () => {
      const result = buildSortOrder()
      expect(result).toEqual({ createdAt: 'desc' })
    })

    it('should sort by name ascending', () => {
      const result = buildSortOrder('name', 'asc')
      expect(result).toEqual({ name: 'asc' })
    })

    it('should sort by name descending', () => {
      const result = buildSortOrder('name', 'desc')
      expect(result).toEqual({ name: 'desc' })
    })

    it('should sort by price ascending (maps to priceRON)', () => {
      const result = buildSortOrder('price', 'asc')
      expect(result).toEqual({ priceRON: 'asc' })
    })

    it('should sort by price descending (maps to priceRON)', () => {
      const result = buildSortOrder('price', 'desc')
      expect(result).toEqual({ priceRON: 'desc' })
    })

    it('should sort by rating ascending', () => {
      const result = buildSortOrder('rating', 'asc')
      expect(result).toEqual({ rating: 'asc' })
    })

    it('should sort by rating descending', () => {
      const result = buildSortOrder('rating', 'desc')
      expect(result).toEqual({ rating: 'desc' })
    })

    it('should sort by newest ascending (maps to createdAt)', () => {
      const result = buildSortOrder('newest', 'asc')
      expect(result).toEqual({ createdAt: 'asc' })
    })

    it('should sort by newest descending (maps to createdAt)', () => {
      const result = buildSortOrder('newest', 'desc')
      expect(result).toEqual({ createdAt: 'desc' })
    })

    it('should sort by stock ascending', () => {
      const result = buildSortOrder('stock', 'asc')
      expect(result).toEqual({ stock: 'asc' })
    })

    it('should sort by stock descending', () => {
      const result = buildSortOrder('stock', 'desc')
      expect(result).toEqual({ stock: 'desc' })
    })

    it('should use default sort order (desc) when only sortBy is provided', () => {
      const result = buildSortOrder('name')
      expect(result).toEqual({ name: 'desc' })
    })

    it('should handle unknown sortBy by defaulting to createdAt', () => {
      const result = buildSortOrder('unknown' as 'name', 'asc')
      expect(result).toEqual({ createdAt: 'asc' })
    })
  })
})
