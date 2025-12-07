export const locales = ['ro', 'en', 'de', 'fr', 'es'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'ro'

export const localeNames: Record<Locale, string> = {
  ro: 'Română',
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
}

export const localeFlags: Record<Locale, string> = {
  ro: '🇷🇴',
  en: '🇬🇧',
  de: '🇩🇪',
  fr: '🇫🇷',
  es: '🇪🇸',
}
