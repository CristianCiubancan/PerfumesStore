import { Metadata } from 'next'
import { locales, defaultLocale, Locale } from '@/i18n/config'
import { env } from '@/lib/env'
import { OG_IMAGE, SEO } from '@/lib/constants'

export const BASE_URL = env.siteUrl

export const SITE_NAME = env.siteName

// Open Graph locale format mapping
export const ogLocaleMap: Record<Locale, string> = {
  ro: 'ro_RO',
  en: 'en_US',
  de: 'de_DE',
  fr: 'fr_FR',
  es: 'es_ES',
}

// Generate alternate language links for hreflang
export function generateAlternates(path: string): Metadata['alternates'] {
  const languages: Record<string, string> = {}

  for (const locale of locales) {
    languages[locale] = `${BASE_URL}/${locale}${path}`
  }

  // x-default points to the default locale
  languages['x-default'] = `${BASE_URL}/${defaultLocale}${path}`

  return {
    canonical: `${BASE_URL}${path}`,
    languages,
  }
}

// Generate Open Graph metadata
export function generateOpenGraph({
  title,
  description,
  url,
  locale,
  images,
  type = 'website',
}: {
  title: string
  description: string
  url: string
  locale: Locale
  images?: { url: string; width?: number; height?: number; alt?: string }[]
  type?: 'website' | 'article'
}): Metadata['openGraph'] {
  return {
    title,
    description,
    url,
    siteName: SITE_NAME,
    locale: ogLocaleMap[locale],
    alternateLocale: locales.filter((l) => l !== locale).map((l) => ogLocaleMap[l]),
    type,
    images: images || [
      {
        url: `${BASE_URL}/images/og-default.jpg`,
        width: OG_IMAGE.WIDTH,
        height: OG_IMAGE.HEIGHT,
        alt: SITE_NAME,
      },
    ],
  }
}

// Generate Twitter Card metadata
export function generateTwitter({
  title,
  description,
  images,
}: {
  title: string
  description: string
  images?: string[]
}): Metadata['twitter'] {
  return {
    card: 'summary_large_image',
    title,
    description,
    images: images || [`${BASE_URL}/images/og-default.jpg`],
  }
}

// Generate complete metadata for a page
export function generatePageMetadata({
  title,
  description,
  path,
  locale,
  images,
  noIndex = false,
  type = 'website',
}: {
  title: string
  description: string
  path: string
  locale: Locale
  images?: { url: string; width?: number; height?: number; alt?: string }[]
  noIndex?: boolean
  type?: 'website' | 'article'
}): Metadata {
  const url = `${BASE_URL}/${locale}${path}`

  return {
    title,
    description,
    alternates: generateAlternates(`/${locale}${path}`),
    openGraph: generateOpenGraph({
      title,
      description,
      url,
      locale,
      images,
      type,
    }),
    twitter: generateTwitter({
      title,
      description,
      images: images?.map((img) => img.url),
    }),
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  }
}

// SEO-friendly product title generator
export function generateProductTitle(
  productName: string,
  brand: string,
  volume?: number
): string {
  const volumeStr = volume ? ` ${volume}ml` : ''
  return `${productName} by ${brand}${volumeStr} | ${SITE_NAME}`
}

// SEO-friendly product description generator
export function generateProductDescription(
  productName: string,
  brand: string,
  concentration: string,
  fragranceFamily?: string,
  description?: string
): string {
  const baseDesc = `Buy ${productName} by ${brand} - ${concentration}`
  const familyPart = fragranceFamily ? `, ${fragranceFamily} fragrance` : ''
  const customPart = description ? `. ${description.slice(0, SEO.DESCRIPTION_MAX_LENGTH)}` : ''

  return `${baseDesc}${familyPart}${customPart}. Authentic luxury perfumes with fast delivery.`
}
