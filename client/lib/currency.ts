import { Currency, ExchangeRates, useCurrencyStore, currencySymbols } from '@/store/currency'
import { api } from '@/lib/api/client'
import { CACHE } from '@/lib/constants'
import { CartItem } from '@/types'

interface ExchangeRatesResponse {
  EUR: number
  GBP: number
  feePercent: number
  fetchedAt: string
}

export async function fetchExchangeRates(): Promise<ExchangeRates> {
  const data = await api.get<ExchangeRatesResponse>('/api/exchange-rates')

  return {
    EUR: data.EUR,
    GBP: data.GBP,
    feePercent: data.feePercent,
  }
}

/**
 * Parses a price string (from API/Prisma Decimal) to a number.
 *
 * Type flow: Prisma Decimal -> JSON string -> parseFloat -> number
 *
 * Note: Using parseFloat is safe for typical retail prices (e.g., 50-5000 RON).
 * For high-precision financial calculations, consider using decimal.js.
 *
 * @param price - Price as string from API (Prisma Decimal serializes to string)
 * @returns Parsed price as number
 */
export function parsePrice(price: string): number {
  const parsed = parseFloat(price)
  if (Number.isNaN(parsed)) {
    return 0
  }
  return parsed
}

/**
 * Calculates the line total for a single cart item.
 *
 * @param priceRON - Unit price as string from API
 * @param quantity - Number of items
 * @returns Line total as number
 */
export function calculateLineTotal(priceRON: string, quantity: number): number {
  return parsePrice(priceRON) * quantity
}

/**
 * Calculates the total price for all items in the cart.
 *
 * Uses proper decimal handling for summing prices.
 *
 * @param items - Array of cart items with priceRON (string) and quantity
 * @returns Total cart price as number
 */
export function calculateCartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => {
    return sum + calculateLineTotal(item.priceRON, item.quantity)
  }, 0)
}

export function convertPrice(
  priceInRON: number,
  currency: Currency,
  exchangeRates: ExchangeRates | null
): number {
  if (currency === 'RON' || !exchangeRates) {
    return priceInRON
  }

  // Apply fee to RON price before conversion (bumps price up)
  const feeMultiplier = 1 + (exchangeRates.feePercent / 100)
  const adjustedRON = priceInRON * feeMultiplier

  // BNR rates are: 1 EUR = X RON, so to convert RON to EUR, divide by X
  const rate = exchangeRates[currency]
  return adjustedRON / rate
}

/**
 * Formats a price for display with currency symbol.
 *
 * Handles both string (from API) and number inputs.
 *
 * @param priceInRON - Price in RON, either as string from API or number
 * @param currency - Target currency for display
 * @param exchangeRates - Current exchange rates (null uses RON)
 * @returns Formatted price string with currency symbol
 */
export function formatPrice(
  priceInRON: number | string,
  currency: Currency,
  exchangeRates: ExchangeRates | null
): string {
  const numericPrice = typeof priceInRON === 'string' ? parsePrice(priceInRON) : priceInRON
  const convertedPrice = convertPrice(numericPrice, currency, exchangeRates)

  // Format with 2 decimal places
  const formattedNumber = convertedPrice.toFixed(2)

  // Return with currency symbol
  if (currency === 'RON') {
    return `${formattedNumber} RON`
  }

  return `${currencySymbols[currency]}${formattedNumber}`
}

export function shouldRefetchRates(lastFetched: number | null): boolean {
  if (!lastFetched) return true
  return Date.now() - lastFetched > CACHE.EXCHANGE_RATE_DURATION_MS
}

// Hook for using formatted prices
export function useFormattedPrice() {
  const { currency, exchangeRates } = useCurrencyStore()

  return (priceInRON: number | string): string => {
    return formatPrice(priceInRON, currency, exchangeRates)
  }
}
