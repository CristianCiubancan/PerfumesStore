import en from './en.json'
import ro from './ro.json'
import fr from './fr.json'
import de from './de.json'
import es from './es.json'

export type Locale = 'en' | 'ro' | 'fr' | 'de' | 'es'

export const SUPPORTED_LOCALES: Locale[] = ['en', 'ro', 'fr', 'de', 'es']
export const DEFAULT_LOCALE: Locale = 'ro'

export interface TranslationStrings {
  orderConfirmation: {
    subject: string
    title: string
    greeting: string
    thankYou: string
    orderNumber: string
    orderDate: string
    shippingAddress: string
    orderSummary: string
    product: string
    quantity: string
    price: string
    subtotal: string
    discount: string
    total: string
    paidAmount: string
    invoiceAttached: string
    questions: string
    footer: string
  }
  newsletterWelcome: {
    subject: string
    title: string
    greeting: string
    thankYou: string
    whatToExpect: string
    exclusiveOffers: string
    newArrivals: string
    fragranceTips: string
    cta: string
    unsubscribe: string
    footer: string
  }
  passwordReset: {
    subject: string
    previewText: string
    title: string
    description: string
    cta: string
    expiryNotice: string
    securityNotice: string
    linkFallback: string
  }
  common: {
    currency: string
    viewOrder: string
    visitStore: string
  }
  invoice: {
    title: string
    invoiceNumber: string
    date: string
    billTo: string
    shipTo: string
    description: string
    quantity: string
    unitPrice: string
    amount: string
    subtotal: string
    discount: string
    total: string
    paidAmount: string
    paymentMethod: string
    creditCard: string
    thankYou: string
    questions: string
    page: string
    of: string
  }
}

const translations: Record<Locale, TranslationStrings> = {
  en,
  ro,
  fr,
  de,
  es,
}

/**
 * Get translations for a specific locale
 */
export function getTranslations(locale: Locale): TranslationStrings {
  return translations[locale] || translations[DEFAULT_LOCALE]
}

/**
 * Normalize and validate locale string
 */
export function normalizeLocale(locale?: string | null): Locale {
  if (!locale) return DEFAULT_LOCALE
  const normalized = locale.toLowerCase() as Locale
  return SUPPORTED_LOCALES.includes(normalized) ? normalized : DEFAULT_LOCALE
}

/**
 * Get locale display name
 */
export function getLocaleDisplayName(locale: Locale): string {
  const names: Record<Locale, string> = {
    en: 'English',
    ro: 'Română',
    fr: 'Français',
    de: 'Deutsch',
    es: 'Español',
  }
  return names[locale]
}

/**
 * Get date format locale string for Intl.DateTimeFormat
 */
export function getDateLocale(locale: Locale): string {
  const localeMap: Record<Locale, string> = {
    en: 'en-GB',
    ro: 'ro-RO',
    fr: 'fr-FR',
    de: 'de-DE',
    es: 'es-ES',
  }
  return localeMap[locale]
}
