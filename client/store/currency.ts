'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Currency = 'RON' | 'EUR' | 'GBP'

export interface ExchangeRates {
  EUR: number
  GBP: number
  feePercent: number
}

interface CurrencyState {
  currency: Currency
  exchangeRates: ExchangeRates | null
  lastFetched: number | null
  isLoading: boolean
  error: string | null
  setCurrency: (currency: Currency) => void
  setExchangeRates: (rates: ExchangeRates) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({
      currency: 'RON',
      exchangeRates: null,
      lastFetched: null,
      isLoading: false,
      error: null,
      setCurrency: (currency) => set({ currency }),
      setExchangeRates: (rates) => set({ exchangeRates: rates, lastFetched: Date.now(), error: null }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error, isLoading: false }),
    }),
    {
      name: 'currency-storage',
      partialize: (state) => ({
        currency: state.currency,
        exchangeRates: state.exchangeRates,
        lastFetched: state.lastFetched,
      }),
    }
  )
)

export const currencySymbols: Record<Currency, string> = {
  RON: 'RON',
  EUR: '\u20AC',
  GBP: '\u00A3',
}

export const currencyNames: Record<Currency, string> = {
  RON: 'Romanian Leu',
  EUR: 'Euro',
  GBP: 'British Pound',
}

export const currencyFlags: Record<Currency, string> = {
  RON: '\u{1F1F7}\u{1F1F4}',
  EUR: '\u{1F1EA}\u{1F1FA}',
  GBP: '\u{1F1EC}\u{1F1E7}',
}
