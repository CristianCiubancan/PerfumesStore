import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCurrencyStore, currencySymbols, currencyNames, currencyFlags, ExchangeRates } from '../currency'

// Mock localStorage for persist middleware
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(global, 'localStorage', { value: localStorageMock })

describe('useCurrencyStore', () => {
  const mockRates: ExchangeRates = {
    EUR: 4.97,
    GBP: 5.95,
    feePercent: 2,
  }

  beforeEach(() => {
    // Reset store to initial state
    useCurrencyStore.setState({
      currency: 'RON',
      exchangeRates: null,
      lastFetched: null,
      isLoading: false,
      error: null,
    })
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('defaults to RON currency', () => {
      expect(useCurrencyStore.getState().currency).toBe('RON')
    })

    it('has null exchange rates initially', () => {
      expect(useCurrencyStore.getState().exchangeRates).toBeNull()
    })

    it('has null lastFetched initially', () => {
      expect(useCurrencyStore.getState().lastFetched).toBeNull()
    })

    it('is not loading initially', () => {
      expect(useCurrencyStore.getState().isLoading).toBe(false)
    })

    it('has no error initially', () => {
      expect(useCurrencyStore.getState().error).toBeNull()
    })
  })

  describe('setCurrency', () => {
    it('sets currency to EUR', () => {
      useCurrencyStore.getState().setCurrency('EUR')
      expect(useCurrencyStore.getState().currency).toBe('EUR')
    })

    it('sets currency to GBP', () => {
      useCurrencyStore.getState().setCurrency('GBP')
      expect(useCurrencyStore.getState().currency).toBe('GBP')
    })

    it('sets currency back to RON', () => {
      useCurrencyStore.getState().setCurrency('EUR')
      useCurrencyStore.getState().setCurrency('RON')
      expect(useCurrencyStore.getState().currency).toBe('RON')
    })
  })

  describe('setExchangeRates', () => {
    it('sets exchange rates', () => {
      useCurrencyStore.getState().setExchangeRates(mockRates)

      const state = useCurrencyStore.getState()
      expect(state.exchangeRates).toEqual(mockRates)
    })

    it('sets lastFetched timestamp', () => {
      const before = Date.now()
      useCurrencyStore.getState().setExchangeRates(mockRates)
      const after = Date.now()

      const lastFetched = useCurrencyStore.getState().lastFetched
      expect(lastFetched).toBeGreaterThanOrEqual(before)
      expect(lastFetched).toBeLessThanOrEqual(after)
    })

    it('clears error when rates are set', () => {
      useCurrencyStore.getState().setError('Previous error')
      useCurrencyStore.getState().setExchangeRates(mockRates)

      expect(useCurrencyStore.getState().error).toBeNull()
    })
  })

  describe('setLoading', () => {
    it('sets loading to true', () => {
      useCurrencyStore.getState().setLoading(true)
      expect(useCurrencyStore.getState().isLoading).toBe(true)
    })

    it('sets loading to false', () => {
      useCurrencyStore.getState().setLoading(true)
      useCurrencyStore.getState().setLoading(false)
      expect(useCurrencyStore.getState().isLoading).toBe(false)
    })
  })

  describe('setError', () => {
    it('sets error message', () => {
      useCurrencyStore.getState().setError('Failed to fetch rates')
      expect(useCurrencyStore.getState().error).toBe('Failed to fetch rates')
    })

    it('clears loading when error is set', () => {
      useCurrencyStore.getState().setLoading(true)
      useCurrencyStore.getState().setError('Error')

      expect(useCurrencyStore.getState().isLoading).toBe(false)
    })

    it('can clear error by setting null', () => {
      useCurrencyStore.getState().setError('Error')
      useCurrencyStore.getState().setError(null)

      expect(useCurrencyStore.getState().error).toBeNull()
    })
  })
})

describe('currency constants', () => {
  describe('currencySymbols', () => {
    it('has symbol for RON', () => {
      expect(currencySymbols.RON).toBe('RON')
    })

    it('has Euro symbol for EUR', () => {
      expect(currencySymbols.EUR).toBe('\u20AC') // Euro sign
    })

    it('has Pound symbol for GBP', () => {
      expect(currencySymbols.GBP).toBe('\u00A3') // Pound sign
    })
  })

  describe('currencyNames', () => {
    it('has name for RON', () => {
      expect(currencyNames.RON).toBe('Romanian Leu')
    })

    it('has name for EUR', () => {
      expect(currencyNames.EUR).toBe('Euro')
    })

    it('has name for GBP', () => {
      expect(currencyNames.GBP).toBe('British Pound')
    })
  })

  describe('currencyFlags', () => {
    it('has flags for all currencies', () => {
      expect(currencyFlags.RON).toBeDefined()
      expect(currencyFlags.EUR).toBeDefined()
      expect(currencyFlags.GBP).toBeDefined()
    })

    it('flags are emoji characters', () => {
      // Flag emojis are typically 4+ characters (regional indicators)
      expect(currencyFlags.RON.length).toBeGreaterThan(0)
      expect(currencyFlags.EUR.length).toBeGreaterThan(0)
      expect(currencyFlags.GBP.length).toBeGreaterThan(0)
    })
  })
})
