import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import {
  parsePrice,
  calculateLineTotal,
  calculateCartTotal,
  convertPrice,
  formatPrice,
  shouldRefetchRates,
  fetchExchangeRates,
  useFormattedPrice,
} from '../currency'
import { ExchangeRates, useCurrencyStore } from '@/store/currency'
import { CartItem } from '@/types'

// Mock constants
vi.mock('@/lib/constants', () => ({
  CACHE: {
    EXCHANGE_RATE_DURATION_MS: 60 * 60 * 1000, // 1 hour
  },
}))

// Mock api client
vi.mock('@/lib/api/client', () => ({
  api: {
    get: vi.fn().mockResolvedValue({
      EUR: 4.97,
      GBP: 5.95,
      feePercent: 2,
      fetchedAt: '2024-01-01T00:00:00Z',
    }),
  },
}))

describe('parsePrice', () => {
  it('parses valid price string', () => {
    expect(parsePrice('100.50')).toBe(100.5)
    expect(parsePrice('0')).toBe(0)
    expect(parsePrice('999.99')).toBe(999.99)
  })

  it('returns 0 for invalid input', () => {
    expect(parsePrice('invalid')).toBe(0)
    expect(parsePrice('')).toBe(0)
    expect(parsePrice('abc123')).toBe(0)
  })

  it('handles edge cases', () => {
    expect(parsePrice('0.00')).toBe(0)
    expect(parsePrice('0.01')).toBe(0.01)
    expect(parsePrice('1000000.00')).toBe(1000000)
  })
})

describe('calculateLineTotal', () => {
  it('calculates line total correctly', () => {
    expect(calculateLineTotal('100.00', 2)).toBe(200)
    expect(calculateLineTotal('50.50', 3)).toBe(151.5)
    expect(calculateLineTotal('10.00', 1)).toBe(10)
  })

  it('handles zero quantity', () => {
    expect(calculateLineTotal('100.00', 0)).toBe(0)
  })

  it('handles invalid price', () => {
    expect(calculateLineTotal('invalid', 2)).toBe(0)
  })
})

describe('calculateCartTotal', () => {
  it('calculates total for multiple items', () => {
    const items: CartItem[] = [
      {
        productId: 1,
        slug: 'perfume-1',
        quantity: 2,
        name: 'Perfume 1',
        brand: 'Brand 1',
        priceRON: '100.00',
        imageUrl: null,
        volumeMl: 50,
        stock: 10,
      },
      {
        productId: 2,
        slug: 'perfume-2',
        quantity: 1,
        name: 'Perfume 2',
        brand: 'Brand 2',
        priceRON: '150.00',
        imageUrl: null,
        volumeMl: 100,
        stock: 5,
      },
    ]

    expect(calculateCartTotal(items)).toBe(350) // (100*2) + (150*1)
  })

  it('returns 0 for empty cart', () => {
    expect(calculateCartTotal([])).toBe(0)
  })

  it('handles single item', () => {
    const items: CartItem[] = [
      {
        productId: 1,
        slug: 'perfume',
        quantity: 3,
        name: 'Perfume',
        brand: 'Brand',
        priceRON: '75.00',
        imageUrl: null,
        volumeMl: 50,
        stock: 10,
      },
    ]

    expect(calculateCartTotal(items)).toBe(225)
  })
})

describe('convertPrice', () => {
  const mockExchangeRates: ExchangeRates = {
    EUR: 4.97,
    GBP: 5.95,
    feePercent: 2,
  }

  it('returns RON price unchanged when currency is RON', () => {
    expect(convertPrice(100, 'RON', mockExchangeRates)).toBe(100)
  })

  it('returns RON price when exchange rates are null', () => {
    expect(convertPrice(100, 'EUR', null)).toBe(100)
  })

  it('converts RON to EUR with fee', () => {
    // 100 RON * 1.02 (fee) / 4.97 (rate) = approx 20.52
    const result = convertPrice(100, 'EUR', mockExchangeRates)
    expect(result).toBeCloseTo(20.52, 1)
  })

  it('converts RON to GBP with fee', () => {
    // 100 RON * 1.02 (fee) / 5.95 (rate) = approx 17.14
    const result = convertPrice(100, 'GBP', mockExchangeRates)
    expect(result).toBeCloseTo(17.14, 1)
  })
})

describe('formatPrice', () => {
  const mockExchangeRates: ExchangeRates = {
    EUR: 4.97,
    GBP: 5.95,
    feePercent: 2,
  }

  it('formats RON price correctly', () => {
    expect(formatPrice(100, 'RON', null)).toBe('100.00 RON')
    expect(formatPrice('99.99', 'RON', null)).toBe('99.99 RON')
  })

  it('formats EUR price with symbol', () => {
    const result = formatPrice(100, 'EUR', mockExchangeRates)
    expect(result).toMatch(/^\u20AC\d+\.\d{2}$/) // Euro symbol followed by number
  })

  it('formats GBP price with symbol', () => {
    const result = formatPrice(100, 'GBP', mockExchangeRates)
    expect(result).toMatch(/^\u00A3\d+\.\d{2}$/) // Pound symbol followed by number
  })

  it('handles string price input', () => {
    expect(formatPrice('150.50', 'RON', null)).toBe('150.50 RON')
  })

  it('handles invalid price string', () => {
    expect(formatPrice('invalid', 'RON', null)).toBe('0.00 RON')
  })
})

describe('shouldRefetchRates', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns true when lastFetched is null', () => {
    expect(shouldRefetchRates(null)).toBe(true)
  })

  it('returns false when recently fetched', () => {
    const now = Date.now()
    vi.setSystemTime(now)
    expect(shouldRefetchRates(now - 1000)).toBe(false) // 1 second ago
  })

  it('returns true when cache expired', () => {
    const now = Date.now()
    vi.setSystemTime(now)
    const oneHourAgo = now - (60 * 60 * 1000 + 1) // 1 hour + 1ms ago
    expect(shouldRefetchRates(oneHourAgo)).toBe(true)
  })

  it('returns false when exactly at cache boundary', () => {
    const now = Date.now()
    vi.setSystemTime(now)
    const exactlyOneHourAgo = now - (60 * 60 * 1000) // Exactly 1 hour ago
    expect(shouldRefetchRates(exactlyOneHourAgo)).toBe(false)
  })
})

describe('fetchExchangeRates', () => {
  it('fetches and returns exchange rates', async () => {
    const rates = await fetchExchangeRates()

    expect(rates).toEqual({
      EUR: 4.97,
      GBP: 5.95,
      feePercent: 2,
    })
  })
})

describe('useFormattedPrice', () => {
  beforeEach(() => {
    // Reset currency store
    useCurrencyStore.setState({
      currency: 'RON',
      exchangeRates: null,
    })
  })

  it('returns a formatting function', () => {
    const { result } = renderHook(() => useFormattedPrice())

    expect(typeof result.current).toBe('function')
  })

  it('formats prices using store currency', () => {
    const { result } = renderHook(() => useFormattedPrice())

    expect(result.current(100)).toBe('100.00 RON')
    expect(result.current('150.50')).toBe('150.50 RON')
  })

  it('updates when currency changes', () => {
    useCurrencyStore.setState({
      currency: 'EUR',
      exchangeRates: { EUR: 4.97, GBP: 5.95, feePercent: 2 },
    })

    const { result } = renderHook(() => useFormattedPrice())

    // Should format as EUR
    const formatted = result.current(100)
    expect(formatted).toMatch(/^\u20AC/)
  })
})
