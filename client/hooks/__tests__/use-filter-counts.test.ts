import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useFilterCounts } from '../use-filter-counts'
import { DEFAULT_FILTERS, FilterValues } from '../use-filter-params'
import { FilterCounts } from '@/types'
import { ExchangeRates } from '@/lib/currency-helpers'

// Mock the API
const mockGetFilterCounts = vi.fn()

vi.mock('@/lib/api/products', () => ({
  productsApi: {
    getFilterCounts: (...args: unknown[]) => mockGetFilterCounts(...args),
  },
}))

// Mock the constants to use shorter debounce for tests
vi.mock('@/lib/constants', () => ({
  TIMING: {
    DEBOUNCE_SHORT_MS: 5, // Very short for testing
  },
}))

// Test exchange rates
const mockExchangeRates: ExchangeRates = {
  EUR: 5,
  GBP: 6,
  feePercent: 0,
}

const mockFilterCounts: FilterCounts = {
  genders: [
    { value: 'Men', count: 42 },
    { value: 'Women', count: 38 },
    { value: 'Unisex', count: 20 },
  ],
  concentrations: [
    { value: 'Eau_de_Parfum', count: 50 },
    { value: 'Eau_de_Toilette', count: 30 },
    { value: 'Parfum', count: 15 },
    { value: 'Eau_de_Cologne', count: 5 },
    { value: 'Extrait_de_Parfum', count: 0 },
  ],
  fragranceFamilies: [
    { id: 1, count: 25 },
    { id: 2, count: 35 },
    { id: 3, count: 40 },
  ],
  longevities: [
    { id: 1, count: 20 },
    { id: 2, count: 40 },
    { id: 3, count: 30 },
    { id: 4, count: 10 },
  ],
  sillages: [
    { id: 1, count: 15 },
    { id: 2, count: 45 },
    { id: 3, count: 40 },
  ],
  seasons: [
    { id: 1, count: 60 },
    { id: 2, count: 55 },
    { id: 3, count: 45 },
    { id: 4, count: 40 },
  ],
  occasions: [
    { id: 1, count: 70 },
    { id: 2, count: 50 },
    { id: 3, count: 30 },
  ],
}

describe('useFilterCounts', () => {
  beforeEach(() => {
    mockGetFilterCounts.mockReset()
    mockGetFilterCounts.mockResolvedValue(mockFilterCounts)
  })

  describe('initial state', () => {
    it('should return null filterCounts initially', () => {
      const { result } = renderHook(() => useFilterCounts(DEFAULT_FILTERS))

      expect(result.current.filterCounts).toBeNull()
    })

    it('should return isLoadingCounts as true initially', () => {
      const { result } = renderHook(() => useFilterCounts(DEFAULT_FILTERS))

      expect(result.current.isLoadingCounts).toBe(true)
    })
  })

  describe('fetching counts', () => {
    it('should fetch counts after debounce', async () => {
      const { result } = renderHook(() => useFilterCounts(DEFAULT_FILTERS))

      await waitFor(() => {
        expect(result.current.filterCounts).toEqual(mockFilterCounts)
      })

      expect(result.current.isLoadingCounts).toBe(false)
      expect(mockGetFilterCounts).toHaveBeenCalledTimes(1)
    })

    it('should call API with correct params for filters', async () => {
      const filters: FilterValues = {
        ...DEFAULT_FILTERS,
        gender: 'Women',
        concentration: 'Eau_de_Parfum',
        fragranceFamilyId: 1,
        seasonIds: [1, 2],
        seasonMatchMode: 'all',
      }

      renderHook(() => useFilterCounts(filters))

      await waitFor(() => {
        expect(mockGetFilterCounts).toHaveBeenCalled()
      })

      const callArgs = mockGetFilterCounts.mock.calls[0][0]
      expect(callArgs.gender).toBe('Women')
      expect(callArgs.concentration).toBe('Eau_de_Parfum')
      expect(callArgs.fragranceFamilyId).toBe(1)
      expect(callArgs.seasonIds).toEqual([1, 2])
      expect(callArgs.seasonMatchMode).toBe('all')
    })

    it('should convert empty filter values to undefined', async () => {
      renderHook(() => useFilterCounts(DEFAULT_FILTERS))

      await waitFor(() => {
        expect(mockGetFilterCounts).toHaveBeenCalled()
      })

      const callArgs = mockGetFilterCounts.mock.calls[0][0]
      expect(callArgs.gender).toBeUndefined()
      expect(callArgs.concentration).toBeUndefined()
      expect(callArgs.search).toBeUndefined()
      expect(callArgs.seasonIds).toBeUndefined()
      expect(callArgs.occasionIds).toBeUndefined()
    })

    it('should handle lookup IDs correctly', async () => {
      const filters: FilterValues = {
        ...DEFAULT_FILTERS,
        longevityId: 2,
        sillageId: 3,
      }

      renderHook(() => useFilterCounts(filters))

      await waitFor(() => {
        expect(mockGetFilterCounts).toHaveBeenCalled()
      })

      const callArgs = mockGetFilterCounts.mock.calls[0][0]
      expect(callArgs.longevityId).toBe(2)
      expect(callArgs.sillageId).toBe(3)
    })
  })

  describe('filter changes', () => {
    it('should refetch when filters change', async () => {
      const { rerender } = renderHook(
        ({ filters }) => useFilterCounts(filters),
        { initialProps: { filters: DEFAULT_FILTERS } }
      )

      // Initial fetch
      await waitFor(() => {
        expect(mockGetFilterCounts).toHaveBeenCalledTimes(1)
      })

      // Change filters
      rerender({
        filters: { ...DEFAULT_FILTERS, gender: 'Men' },
      })

      // Should trigger new fetch
      await waitFor(() => {
        expect(mockGetFilterCounts).toHaveBeenCalledTimes(2)
      })

      // Verify the second call had the new gender
      const secondCallArgs = mockGetFilterCounts.mock.calls[1][0]
      expect(secondCallArgs.gender).toBe('Men')
    })
  })

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockGetFilterCounts.mockRejectedValue(new Error('API Error'))

      const { result } = renderHook(() => useFilterCounts(DEFAULT_FILTERS))

      await waitFor(() => {
        expect(result.current.isLoadingCounts).toBe(false)
      })

      // Should remain null on error
      expect(result.current.filterCounts).toBeNull()

      consoleSpy.mockRestore()
    })

    it('should not log abort errors from the hook', async () => {
      // Only mock console.error calls that contain "Failed to load filter counts"
      const hookErrorSpy = vi.fn()
      const originalError = console.error
      console.error = (...args: unknown[]) => {
        const message = String(args[0] || '')
        if (message.includes('Failed to load filter counts')) {
          hookErrorSpy(...args)
        }
        // Suppress React act() warnings in tests
      }

      const abortError = new Error('Aborted')
      abortError.name = 'AbortError'
      mockGetFilterCounts.mockRejectedValue(abortError)

      renderHook(() => useFilterCounts(DEFAULT_FILTERS))

      // Wait for the hook to process
      await waitFor(() => {
        expect(mockGetFilterCounts).toHaveBeenCalled()
      })

      // Should not log abort errors from the hook itself
      expect(hookErrorSpy).not.toHaveBeenCalled()

      console.error = originalError
    })
  })

  describe('price conversion', () => {
    it('should convert prices to RON when currency and exchangeRates provided', async () => {
      const filters: FilterValues = {
        ...DEFAULT_FILTERS,
        minPrice: '100',
        maxPrice: '200',
      }

      renderHook(() =>
        useFilterCounts(filters, { currency: 'EUR', exchangeRates: mockExchangeRates })
      )

      await waitFor(() => {
        expect(mockGetFilterCounts).toHaveBeenCalled()
      })

      const callArgs = mockGetFilterCounts.mock.calls[0][0]
      // EUR rate is 5, feePercent is 0, so: price * rate / (1 + fee/100) = 100 * 5 / 1 = 500
      expect(callArgs.minPrice).toBe(500)
      expect(callArgs.maxPrice).toBe(1000)
    })

    it('should parse prices without conversion when currency is RON', async () => {
      const filters: FilterValues = {
        ...DEFAULT_FILTERS,
        minPrice: '100',
        maxPrice: '200',
      }

      renderHook(() => useFilterCounts(filters, { currency: 'RON' }))

      await waitFor(() => {
        expect(mockGetFilterCounts).toHaveBeenCalled()
      })

      const callArgs = mockGetFilterCounts.mock.calls[0][0]
      expect(callArgs.minPrice).toBe(100)
      expect(callArgs.maxPrice).toBe(200)
    })

    it('should parse prices without conversion when no options provided', async () => {
      const filters: FilterValues = {
        ...DEFAULT_FILTERS,
        minPrice: '100',
        maxPrice: '200',
      }

      renderHook(() => useFilterCounts(filters))

      await waitFor(() => {
        expect(mockGetFilterCounts).toHaveBeenCalled()
      })

      const callArgs = mockGetFilterCounts.mock.calls[0][0]
      expect(callArgs.minPrice).toBe(100)
      expect(callArgs.maxPrice).toBe(200)
    })
  })

  describe('rating conversion', () => {
    it('should parse rating values correctly', async () => {
      const filters: FilterValues = {
        ...DEFAULT_FILTERS,
        minRating: '3.5',
        maxRating: '5',
      }

      renderHook(() => useFilterCounts(filters))

      await waitFor(() => {
        expect(mockGetFilterCounts).toHaveBeenCalled()
      })

      const callArgs = mockGetFilterCounts.mock.calls[0][0]
      expect(callArgs.minRating).toBe(3.5)
      expect(callArgs.maxRating).toBe(5)
    })
  })

  describe('occasion and season match modes', () => {
    it('should pass occasion match mode correctly', async () => {
      const filters: FilterValues = {
        ...DEFAULT_FILTERS,
        occasionIds: [1, 2],
        occasionMatchMode: 'all',
      }

      renderHook(() => useFilterCounts(filters))

      await waitFor(() => {
        expect(mockGetFilterCounts).toHaveBeenCalled()
      })

      const callArgs = mockGetFilterCounts.mock.calls[0][0]
      expect(callArgs.occasionIds).toEqual([1, 2])
      expect(callArgs.occasionMatchMode).toBe('all')
    })
  })
})
