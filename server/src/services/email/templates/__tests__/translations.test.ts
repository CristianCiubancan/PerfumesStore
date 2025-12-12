import {
  getTranslations,
  normalizeLocale,
  getLocaleDisplayName,
  getDateLocale,
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  type Locale,
} from '../translations'

describe('Email Translations', () => {
  describe('SUPPORTED_LOCALES', () => {
    it('should contain all 5 supported languages', () => {
      expect(SUPPORTED_LOCALES).toHaveLength(5)
      expect(SUPPORTED_LOCALES).toContain('en')
      expect(SUPPORTED_LOCALES).toContain('ro')
      expect(SUPPORTED_LOCALES).toContain('fr')
      expect(SUPPORTED_LOCALES).toContain('de')
      expect(SUPPORTED_LOCALES).toContain('es')
    })
  })

  describe('DEFAULT_LOCALE', () => {
    it('should be Romanian', () => {
      expect(DEFAULT_LOCALE).toBe('ro')
    })
  })

  describe('getTranslations', () => {
    it.each(SUPPORTED_LOCALES)('should return translations for %s', (locale) => {
      const translations = getTranslations(locale)

      expect(translations).toBeDefined()
      expect(translations.orderConfirmation).toBeDefined()
      expect(translations.newsletterWelcome).toBeDefined()
      expect(translations.common).toBeDefined()
      expect(translations.invoice).toBeDefined()
    })

    it('should have all required orderConfirmation fields', () => {
      const translations = getTranslations('en')

      expect(translations.orderConfirmation.subject).toBeDefined()
      expect(translations.orderConfirmation.title).toBeDefined()
      expect(translations.orderConfirmation.greeting).toBeDefined()
      expect(translations.orderConfirmation.thankYou).toBeDefined()
      expect(translations.orderConfirmation.orderNumber).toBeDefined()
      expect(translations.orderConfirmation.orderDate).toBeDefined()
      expect(translations.orderConfirmation.shippingAddress).toBeDefined()
      expect(translations.orderConfirmation.orderSummary).toBeDefined()
      expect(translations.orderConfirmation.product).toBeDefined()
      expect(translations.orderConfirmation.quantity).toBeDefined()
      expect(translations.orderConfirmation.price).toBeDefined()
      expect(translations.orderConfirmation.subtotal).toBeDefined()
      expect(translations.orderConfirmation.discount).toBeDefined()
      expect(translations.orderConfirmation.total).toBeDefined()
    })

    it('should have all required newsletterWelcome fields', () => {
      const translations = getTranslations('en')

      expect(translations.newsletterWelcome.subject).toBeDefined()
      expect(translations.newsletterWelcome.title).toBeDefined()
      expect(translations.newsletterWelcome.greeting).toBeDefined()
      expect(translations.newsletterWelcome.thankYou).toBeDefined()
      expect(translations.newsletterWelcome.whatToExpect).toBeDefined()
      expect(translations.newsletterWelcome.exclusiveOffers).toBeDefined()
      expect(translations.newsletterWelcome.newArrivals).toBeDefined()
      expect(translations.newsletterWelcome.fragranceTips).toBeDefined()
      expect(translations.newsletterWelcome.cta).toBeDefined()
      expect(translations.newsletterWelcome.unsubscribe).toBeDefined()
    })

    it('should have all required invoice fields', () => {
      const translations = getTranslations('en')

      expect(translations.invoice.title).toBeDefined()
      expect(translations.invoice.invoiceNumber).toBeDefined()
      expect(translations.invoice.date).toBeDefined()
      expect(translations.invoice.shipTo).toBeDefined()
      expect(translations.invoice.description).toBeDefined()
      expect(translations.invoice.quantity).toBeDefined()
      expect(translations.invoice.unitPrice).toBeDefined()
      expect(translations.invoice.amount).toBeDefined()
      expect(translations.invoice.subtotal).toBeDefined()
      expect(translations.invoice.discount).toBeDefined()
      expect(translations.invoice.total).toBeDefined()
    })

    it('should return different translations for different locales', () => {
      const en = getTranslations('en')
      const ro = getTranslations('ro')
      const fr = getTranslations('fr')

      expect(en.orderConfirmation.subject).not.toBe(ro.orderConfirmation.subject)
      expect(en.orderConfirmation.subject).not.toBe(fr.orderConfirmation.subject)
      expect(ro.orderConfirmation.subject).not.toBe(fr.orderConfirmation.subject)
    })

    it('should return default locale translations for invalid locale', () => {
      const translations = getTranslations('invalid' as Locale)
      const defaultTranslations = getTranslations(DEFAULT_LOCALE)

      expect(translations).toEqual(defaultTranslations)
    })
  })

  describe('normalizeLocale', () => {
    it('should return the locale if it is supported', () => {
      expect(normalizeLocale('en')).toBe('en')
      expect(normalizeLocale('ro')).toBe('ro')
      expect(normalizeLocale('fr')).toBe('fr')
      expect(normalizeLocale('de')).toBe('de')
      expect(normalizeLocale('es')).toBe('es')
    })

    it('should handle uppercase locales', () => {
      expect(normalizeLocale('EN')).toBe('en')
      expect(normalizeLocale('RO')).toBe('ro')
      expect(normalizeLocale('FR')).toBe('fr')
    })

    it('should handle mixed case locales', () => {
      expect(normalizeLocale('En')).toBe('en')
      expect(normalizeLocale('rO')).toBe('ro')
    })

    it('should return default locale for null', () => {
      expect(normalizeLocale(null)).toBe(DEFAULT_LOCALE)
    })

    it('should return default locale for undefined', () => {
      expect(normalizeLocale(undefined)).toBe(DEFAULT_LOCALE)
    })

    it('should return default locale for empty string', () => {
      expect(normalizeLocale('')).toBe(DEFAULT_LOCALE)
    })

    it('should return default locale for unsupported locales', () => {
      expect(normalizeLocale('zh')).toBe(DEFAULT_LOCALE)
      expect(normalizeLocale('ja')).toBe(DEFAULT_LOCALE)
      expect(normalizeLocale('invalid')).toBe(DEFAULT_LOCALE)
    })
  })

  describe('getLocaleDisplayName', () => {
    it('should return correct display names', () => {
      expect(getLocaleDisplayName('en')).toBe('English')
      expect(getLocaleDisplayName('ro')).toBe('Română')
      expect(getLocaleDisplayName('fr')).toBe('Français')
      expect(getLocaleDisplayName('de')).toBe('Deutsch')
      expect(getLocaleDisplayName('es')).toBe('Español')
    })
  })

  describe('getDateLocale', () => {
    it('should return correct date locale strings', () => {
      expect(getDateLocale('en')).toBe('en-GB')
      expect(getDateLocale('ro')).toBe('ro-RO')
      expect(getDateLocale('fr')).toBe('fr-FR')
      expect(getDateLocale('de')).toBe('de-DE')
      expect(getDateLocale('es')).toBe('es-ES')
    })
  })
})
