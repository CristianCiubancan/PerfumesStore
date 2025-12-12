import { Prisma } from '@prisma/client'
import { buildWhereExcluding } from '../filter-count-builder'
import { ProductFilterParams } from '../filter-builder'

describe('FilterCountBuilder', () => {
  describe('buildWhereExcluding', () => {
    const baseParams: ProductFilterParams = {
      brand: 'Chanel',
      gender: 'Women',
      concentration: 'Eau_de_Parfum',
      minPrice: 100,
      maxPrice: 500,
      search: 'rose',
      fragranceFamilyId: 1,
      longevityId: 2,
      sillageId: 3,
      seasonIds: [1, 2],
      seasonMatchMode: 'any',
      occasionIds: [3, 4],
      occasionMatchMode: 'any',
      minRating: 4.0,
      maxRating: 5.0,
    }

    it('should always include deletedAt: null', () => {
      const result = buildWhereExcluding({}, 'gender')
      expect(result.deletedAt).toBeNull()
    })

    describe('excluding gender', () => {
      it('should exclude gender filter but keep all others', () => {
        const result = buildWhereExcluding(baseParams, 'gender')

        // Gender should NOT be in the result
        expect(result).not.toHaveProperty('gender')

        // All other filters should be present
        expect(result.brand).toEqual({ contains: 'Chanel', mode: 'insensitive' })
        expect(result.concentration).toBe('Eau_de_Parfum')
        expect(result.fragranceFamilyId).toBe(1)
        expect(result.longevityId).toBe(2)
        expect(result.sillageId).toBe(3)
      })

      it('should include price filter when excluding gender', () => {
        const result = buildWhereExcluding(baseParams, 'gender')

        expect(result).toHaveProperty('priceRON')
        const priceFilter = result.priceRON as Prisma.DecimalFilter
        expect(priceFilter.gte?.toString()).toBe('100')
        expect(priceFilter.lte?.toString()).toBe('500')
      })

      it('should include rating filter when excluding gender', () => {
        const result = buildWhereExcluding(baseParams, 'gender')

        expect(result).toHaveProperty('rating')
        const ratingFilter = result.rating as Prisma.DecimalFilter
        expect(ratingFilter.gte?.toString()).toBe('4')
        expect(ratingFilter.lte?.toString()).toBe('5')
      })

      it('should include search OR clause when excluding gender', () => {
        const result = buildWhereExcluding(baseParams, 'gender')

        expect(result.OR).toEqual([
          { name: { contains: 'rose', mode: 'insensitive' } },
          { brand: { contains: 'rose', mode: 'insensitive' } },
          { description: { contains: 'rose', mode: 'insensitive' } },
        ])
      })

      it('should include season filter when excluding gender', () => {
        const result = buildWhereExcluding(baseParams, 'gender')

        expect(result.seasons).toEqual({ some: { id: { in: [1, 2] } } })
      })

      it('should include occasion filter when excluding gender', () => {
        const result = buildWhereExcluding(baseParams, 'gender')

        expect(result.occasions).toEqual({ some: { id: { in: [3, 4] } } })
      })
    })

    describe('excluding concentration', () => {
      it('should exclude concentration filter but keep gender', () => {
        const result = buildWhereExcluding(baseParams, 'concentration')

        expect(result).not.toHaveProperty('concentration')
        expect(result.gender).toBe('Women')
        expect(result.brand).toEqual({ contains: 'Chanel', mode: 'insensitive' })
      })
    })

    describe('excluding fragranceFamilyId', () => {
      it('should exclude fragranceFamilyId but keep longevityId and sillageId', () => {
        const result = buildWhereExcluding(baseParams, 'fragranceFamilyId')

        expect(result).not.toHaveProperty('fragranceFamilyId')
        expect(result.longevityId).toBe(2)
        expect(result.sillageId).toBe(3)
        expect(result.gender).toBe('Women')
        expect(result.concentration).toBe('Eau_de_Parfum')
      })
    })

    describe('excluding longevityId', () => {
      it('should exclude longevityId but keep fragranceFamilyId and sillageId', () => {
        const result = buildWhereExcluding(baseParams, 'longevityId')

        expect(result).not.toHaveProperty('longevityId')
        expect(result.fragranceFamilyId).toBe(1)
        expect(result.sillageId).toBe(3)
      })
    })

    describe('excluding sillageId', () => {
      it('should exclude sillageId but keep fragranceFamilyId and longevityId', () => {
        const result = buildWhereExcluding(baseParams, 'sillageId')

        expect(result).not.toHaveProperty('sillageId')
        expect(result.fragranceFamilyId).toBe(1)
        expect(result.longevityId).toBe(2)
      })
    })

    describe('excluding seasonIds', () => {
      it('should exclude season filter but keep occasion filter', () => {
        const result = buildWhereExcluding(baseParams, 'seasonIds')

        expect(result).not.toHaveProperty('seasons')
        expect(result.occasions).toEqual({ some: { id: { in: [3, 4] } } })
        expect(result.gender).toBe('Women')
      })

      it('should handle "all" match mode for occasions when excluding seasons', () => {
        const params: ProductFilterParams = {
          ...baseParams,
          occasionMatchMode: 'all',
        }
        const result = buildWhereExcluding(params, 'seasonIds')

        expect(result).not.toHaveProperty('seasons')
        expect(result.AND).toEqual([
          { occasions: { some: { id: 3 } } },
          { occasions: { some: { id: 4 } } },
        ])
      })
    })

    describe('excluding occasionIds', () => {
      it('should exclude occasion filter but keep season filter', () => {
        const result = buildWhereExcluding(baseParams, 'occasionIds')

        expect(result).not.toHaveProperty('occasions')
        expect(result.seasons).toEqual({ some: { id: { in: [1, 2] } } })
        expect(result.gender).toBe('Women')
      })

      it('should handle "all" match mode for seasons when excluding occasions', () => {
        const params: ProductFilterParams = {
          ...baseParams,
          seasonMatchMode: 'all',
        }
        const result = buildWhereExcluding(params, 'occasionIds')

        expect(result).not.toHaveProperty('occasions')
        expect(result.AND).toEqual([
          { seasons: { some: { id: 1 } } },
          { seasons: { some: { id: 2 } } },
        ])
      })
    })

    describe('with empty/undefined filter values', () => {
      it('should handle empty params', () => {
        const result = buildWhereExcluding({}, 'gender')

        expect(result).toEqual({ deletedAt: null })
      })

      it('should handle undefined optional fields', () => {
        const params: ProductFilterParams = {
          gender: 'Men',
        }
        const result = buildWhereExcluding(params, 'concentration')

        expect(result.gender).toBe('Men')
        expect(result).not.toHaveProperty('concentration')
        expect(result).not.toHaveProperty('brand')
        expect(result).not.toHaveProperty('fragranceFamilyId')
      })

      it('should handle empty arrays', () => {
        const params: ProductFilterParams = {
          gender: 'Men',
          seasonIds: [],
          occasionIds: [],
        }
        const result = buildWhereExcluding(params, 'concentration')

        expect(result.gender).toBe('Men')
        expect(result).not.toHaveProperty('seasons')
        expect(result).not.toHaveProperty('occasions')
      })
    })

    describe('combined season and occasion with all match mode', () => {
      it('should combine both in AND clause when neither is excluded', () => {
        const params: ProductFilterParams = {
          seasonIds: [1],
          seasonMatchMode: 'all',
          occasionIds: [2],
          occasionMatchMode: 'all',
        }
        const result = buildWhereExcluding(params, 'gender')

        expect(result.AND).toEqual([
          { seasons: { some: { id: 1 } } },
          { occasions: { some: { id: 2 } } },
        ])
      })

      it('should only include occasion AND when seasons excluded', () => {
        const params: ProductFilterParams = {
          seasonIds: [1],
          seasonMatchMode: 'all',
          occasionIds: [2],
          occasionMatchMode: 'all',
        }
        const result = buildWhereExcluding(params, 'seasonIds')

        expect(result.AND).toEqual([{ occasions: { some: { id: 2 } } }])
        expect(result).not.toHaveProperty('seasons')
      })

      it('should only include season AND when occasions excluded', () => {
        const params: ProductFilterParams = {
          seasonIds: [1],
          seasonMatchMode: 'all',
          occasionIds: [2],
          occasionMatchMode: 'all',
        }
        const result = buildWhereExcluding(params, 'occasionIds')

        expect(result.AND).toEqual([{ seasons: { some: { id: 1 } } }])
        expect(result).not.toHaveProperty('occasions')
      })
    })
  })
})
