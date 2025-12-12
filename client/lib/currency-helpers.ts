/**
 * Currency Conversion Helpers
 *
 * Utilities for converting between currencies, primarily used for filter operations
 * where prices need to be converted back to RON for API queries.
 */

export type CurrencyCode = 'RON' | 'EUR' | 'GBP'

export interface ExchangeRates {
  EUR: number
  GBP: number
  feePercent: number
}

/**
 * Convert price from selected currency to RON for API filtering.
 * This reverses the conversion done in formatPrice/convertPrice.
 *
 * @param price - The price in the selected currency
 * @param currency - The current currency code
 * @param exchangeRates - Exchange rates from BNR (or null if not loaded)
 * @returns The equivalent price in RON
 */
export function convertToRON(
  price: number,
  currency: CurrencyCode,
  exchangeRates: ExchangeRates | null
): number {
  if (currency === 'RON' || !exchangeRates) {
    return price
  }
  // BNR rates are: 1 EUR = X RON, so to convert to RON, multiply by X
  const priceInAdjustedRON = price * exchangeRates[currency]

  // Remove the fee that was applied when displaying prices
  // (formatPrice applies: priceRON * feeMultiplier / rate, so we reverse it)
  const feeMultiplier = 1 + exchangeRates.feePercent / 100
  return priceInAdjustedRON / feeMultiplier
}

/**
 * Build API filter params for price range, converting from display currency to RON.
 *
 * @param minPrice - Minimum price string (or empty)
 * @param maxPrice - Maximum price string (or empty)
 * @param currency - Current currency code
 * @param exchangeRates - Exchange rates
 * @returns Object with minPrice and maxPrice in RON (or undefined if not set)
 */
export function buildPriceFilterParams(
  minPrice: string,
  maxPrice: string,
  currency: CurrencyCode,
  exchangeRates: ExchangeRates | null
): { minPrice?: number; maxPrice?: number } {
  return {
    minPrice: minPrice
      ? convertToRON(parseFloat(minPrice), currency, exchangeRates)
      : undefined,
    maxPrice: maxPrice
      ? convertToRON(parseFloat(maxPrice), currency, exchangeRates)
      : undefined,
  }
}
