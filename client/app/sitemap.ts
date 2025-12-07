import { MetadataRoute } from 'next'
import { locales, defaultLocale } from '@/i18n/config'
import { env } from '@/lib/env'
import { SITEMAP } from '@/lib/constants'

const BASE_URL = env.siteUrl

// Static pages that exist for all locales
// Note: /login and /register are excluded since they have noindex robots directive
const staticPages = [
  '',           // Home
  '/store',     // Store/catalog
]

// Fetch products from the API for dynamic sitemap generation
async function getProducts(): Promise<{ slug: string; updatedAt: string }[]> {
  try {
    const response = await fetch(`${env.apiUrl}/api/products?limit=${SITEMAP.PRODUCT_LIMIT}`, {
      next: { revalidate: SITEMAP.REVALIDATE_SECONDS },
    })

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    return data.data.products.map((p: { slug: string; updatedAt?: string }) => ({
      slug: p.slug,
      updatedAt: p.updatedAt || new Date().toISOString(),
    }))
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts()
  const currentDate = new Date().toISOString()

  const sitemapEntries: MetadataRoute.Sitemap = []

  // Add static pages for each locale
  for (const locale of locales) {
    for (const page of staticPages) {
      const isHomePage = page === ''
      const isStorePage = page === '/store'

      sitemapEntries.push({
        url: `${BASE_URL}/${locale}${page}`,
        lastModified: currentDate,
        changeFrequency: isHomePage ? SITEMAP.CHANGE_FREQUENCY.HOME : isStorePage ? SITEMAP.CHANGE_FREQUENCY.STORE : SITEMAP.CHANGE_FREQUENCY.DEFAULT,
        priority: isHomePage ? SITEMAP.PRIORITY.HOME : isStorePage ? SITEMAP.PRIORITY.STORE : SITEMAP.PRIORITY.DEFAULT,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [
              l === defaultLocale ? 'x-default' : l,
              `${BASE_URL}/${l}${page}`,
            ])
          ),
        },
      })
    }
  }

  // Add product pages for each locale (using SEO-friendly slugs)
  for (const product of products) {
    for (const locale of locales) {
      sitemapEntries.push({
        url: `${BASE_URL}/${locale}/product/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: SITEMAP.CHANGE_FREQUENCY.PRODUCT,
        priority: SITEMAP.PRIORITY.PRODUCT,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [
              l === defaultLocale ? 'x-default' : l,
              `${BASE_URL}/${l}/product/${product.slug}`,
            ])
          ),
        },
      })
    }
  }

  return sitemapEntries
}
