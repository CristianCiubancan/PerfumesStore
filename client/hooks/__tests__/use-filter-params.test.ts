import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFilterParams, DEFAULT_FILTERS } from '../use-filter-params'

// Track router.push calls
const pushMock = vi.fn()

// Mock searchParams
let mockSearchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
  }),
  usePathname: () => '/store',
}))

describe('useFilterParams', () => {
  beforeEach(() => {
    mockSearchParams = new URLSearchParams()
    pushMock.mockClear()
  })

  describe('DEFAULT_FILTERS', () => {
    it('has expected default values', () => {
      expect(DEFAULT_FILTERS.search).toBe('')
      expect(DEFAULT_FILTERS.gender).toBe('')
      expect(DEFAULT_FILTERS.concentration).toBe('')
      expect(DEFAULT_FILTERS.sortBy).toBe('newest')
      expect(DEFAULT_FILTERS.sortOrder).toBe('desc')
      expect(DEFAULT_FILTERS.seasonIds).toEqual([])
      expect(DEFAULT_FILTERS.occasionIds).toEqual([])
      expect(DEFAULT_FILTERS.seasonMatchMode).toBe('any')
      expect(DEFAULT_FILTERS.occasionMatchMode).toBe('any')
    })
  })

  describe('filters parsing', () => {
    it('returns default filters when no params', () => {
      const { result } = renderHook(() => useFilterParams())

      expect(result.current.filters).toEqual(DEFAULT_FILTERS)
      expect(result.current.page).toBe(1)
    })

    it('parses search param', () => {
      mockSearchParams = new URLSearchParams('search=perfume')
      const { result } = renderHook(() => useFilterParams())

      expect(result.current.filters.search).toBe('perfume')
    })

    it('parses gender param', () => {
      mockSearchParams = new URLSearchParams('gender=Men')
      const { result } = renderHook(() => useFilterParams())

      expect(result.current.filters.gender).toBe('Men')
    })

    it('parses concentration param', () => {
      mockSearchParams = new URLSearchParams('concentration=Eau_de_Parfum')
      const { result } = renderHook(() => useFilterParams())

      expect(result.current.filters.concentration).toBe('Eau_de_Parfum')
    })

    it('parses price range params', () => {
      mockSearchParams = new URLSearchParams('minPrice=100&maxPrice=500')
      const { result } = renderHook(() => useFilterParams())

      expect(result.current.filters.minPrice).toBe('100')
      expect(result.current.filters.maxPrice).toBe('500')
    })

    it('parses sort params', () => {
      mockSearchParams = new URLSearchParams('sortBy=price&sortOrder=asc')
      const { result } = renderHook(() => useFilterParams())

      expect(result.current.filters.sortBy).toBe('price')
      expect(result.current.filters.sortOrder).toBe('asc')
    })

    it('parses lookup table ID params', () => {
      mockSearchParams = new URLSearchParams('fragranceFamilyId=1&longevityId=2&sillageId=3')
      const { result } = renderHook(() => useFilterParams())

      expect(result.current.filters.fragranceFamilyId).toBe(1)
      expect(result.current.filters.longevityId).toBe(2)
      expect(result.current.filters.sillageId).toBe(3)
    })

    it('parses array params', () => {
      mockSearchParams = new URLSearchParams('seasonIds=1,2,3&occasionIds=4,5')
      const { result } = renderHook(() => useFilterParams())

      expect(result.current.filters.seasonIds).toEqual([1, 2, 3])
      expect(result.current.filters.occasionIds).toEqual([4, 5])
    })

    it('parses match mode params', () => {
      mockSearchParams = new URLSearchParams('seasonMatchMode=all&occasionMatchMode=all')
      const { result } = renderHook(() => useFilterParams())

      expect(result.current.filters.seasonMatchMode).toBe('all')
      expect(result.current.filters.occasionMatchMode).toBe('all')
    })

    it('parses rating params', () => {
      mockSearchParams = new URLSearchParams('minRating=3&maxRating=5')
      const { result } = renderHook(() => useFilterParams())

      expect(result.current.filters.minRating).toBe('3')
      expect(result.current.filters.maxRating).toBe('5')
    })

    it('parses page param', () => {
      mockSearchParams = new URLSearchParams('page=3')
      const { result } = renderHook(() => useFilterParams())

      expect(result.current.page).toBe(3)
    })

    it('handles invalid numeric params', () => {
      mockSearchParams = new URLSearchParams('fragranceFamilyId=invalid&seasonIds=a,b,c')
      const { result } = renderHook(() => useFilterParams())

      expect(result.current.filters.fragranceFamilyId).toBeNull()
      expect(result.current.filters.seasonIds).toEqual([])
    })
  })

  describe('setFilters', () => {
    it('updates URL with new filters', () => {
      const { result } = renderHook(() => useFilterParams())

      act(() => {
        result.current.setFilters({
          ...DEFAULT_FILTERS,
          search: 'rose',
          gender: 'Women',
        })
      })

      expect(pushMock).toHaveBeenCalledWith(
        '/store?search=rose&gender=Women',
        { scroll: false }
      )
    })

    it('omits default values from URL', () => {
      const { result } = renderHook(() => useFilterParams())

      act(() => {
        result.current.setFilters({
          ...DEFAULT_FILTERS,
          sortBy: 'newest', // default
          sortOrder: 'desc', // default
          search: 'test',
        })
      })

      // Should only include search, not sortBy/sortOrder
      expect(pushMock).toHaveBeenCalledWith(
        '/store?search=test',
        { scroll: false }
      )
    })

    it('includes non-default sort values', () => {
      const { result } = renderHook(() => useFilterParams())

      act(() => {
        result.current.setFilters({
          ...DEFAULT_FILTERS,
          sortBy: 'price',
          sortOrder: 'asc',
        })
      })

      expect(pushMock).toHaveBeenCalledWith(
        '/store?sortBy=price&sortOrder=asc',
        { scroll: false }
      )
    })

    it('handles array values', () => {
      const { result } = renderHook(() => useFilterParams())

      act(() => {
        result.current.setFilters({
          ...DEFAULT_FILTERS,
          seasonIds: [1, 2, 3],
          occasionIds: [4, 5],
        })
      })

      expect(pushMock).toHaveBeenCalledWith(
        '/store?seasonIds=1%2C2%2C3&occasionIds=4%2C5',
        { scroll: false }
      )
    })

    it('clears URL when all filters are default', () => {
      const { result } = renderHook(() => useFilterParams())

      act(() => {
        result.current.setFilters(DEFAULT_FILTERS)
      })

      expect(pushMock).toHaveBeenCalledWith('/store', { scroll: false })
    })
  })

  describe('setPage', () => {
    it('updates page in URL', () => {
      const { result } = renderHook(() => useFilterParams())

      act(() => {
        result.current.setPage(5)
      })

      expect(pushMock).toHaveBeenCalledWith('/store?page=5', { scroll: false })
    })

    it('removes page param when page is 1', () => {
      mockSearchParams = new URLSearchParams('page=3')
      const { result } = renderHook(() => useFilterParams())

      act(() => {
        result.current.setPage(1)
      })

      expect(pushMock).toHaveBeenCalledWith('/store', { scroll: false })
    })

    it('preserves other params when changing page', () => {
      mockSearchParams = new URLSearchParams('search=test&gender=Men')
      const { result } = renderHook(() => useFilterParams())

      act(() => {
        result.current.setPage(2)
      })

      expect(pushMock).toHaveBeenCalledWith(
        '/store?search=test&gender=Men&page=2',
        { scroll: false }
      )
    })
  })

  describe('resetFilters', () => {
    it('clears all filters', () => {
      mockSearchParams = new URLSearchParams('search=test&gender=Men&page=3')
      const { result } = renderHook(() => useFilterParams())

      act(() => {
        result.current.resetFilters()
      })

      expect(pushMock).toHaveBeenCalledWith('/store', { scroll: false })
    })
  })
})
