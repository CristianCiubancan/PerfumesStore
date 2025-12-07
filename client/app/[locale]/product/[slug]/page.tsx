import { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { Locale, locales, defaultLocale } from '@/i18n/config'
import { env } from '@/lib/env'
import { ProductDetailClient } from './product-detail-client'
import { ProductSchema, BreadcrumbSchema } from '@/components/seo/structured-data'
import {
  BASE_URL,
  SITE_NAME,
  ogLocaleMap,
  generateProductTitle,
  generateProductDescription,
} from '@/lib/seo'

interface Props {
  params: Promise<{ locale: string; slug: string }>
}

// Fetch product data for metadata using SEO-friendly slug
async function getProduct(slug: string) {
  try {
    const response = await fetch(`${env.apiUrl}/api/products/by-slug/${slug}`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!response.ok) {
      return null
    }

    const json = await response.json()
    return json.data || json
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const product = await getProduct(slug)

  // Default metadata if product not found
  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'The requested product could not be found.',
      robots: { index: false, follow: true },
    }
  }

  const title = generateProductTitle(product.name, product.brand, product.volumeMl)
  const description = generateProductDescription(
    product.name,
    product.brand,
    product.concentration.replace(/_/g, ' '),
    product.fragranceFamily?.name,
    product.description
  )

  // Generate alternate language URLs using SEO-friendly slug
  const languages: Record<string, string> = {}
  for (const l of locales) {
    languages[l] = `${BASE_URL}/${l}/product/${slug}`
  }
  languages['x-default'] = `${BASE_URL}/${defaultLocale}/product/${slug}`

  // Product image URL
  const imageUrl = product.imageUrl
    ? product.imageUrl.startsWith('http')
      ? product.imageUrl
      : `${BASE_URL}${product.imageUrl}`
    : `${BASE_URL}/images/og-default.jpg`

  return {
    title: `${product.name} by ${product.brand}`,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/product/${slug}`,
      languages,
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/product/${slug}`,
      siteName: SITE_NAME,
      locale: ogLocaleMap[locale as Locale] || 'en_US',
      alternateLocale: locales
        .filter((l) => l !== locale)
        .map((l) => ogLocaleMap[l]),
      type: 'website',
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 800,
          alt: `${product.name} by ${product.brand}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale as Locale)

  // Fetch product for JSON-LD schema
  const product = await getProduct(slug)

  // Generate image URL for schema
  const imageUrl = product?.imageUrl
    ? product.imageUrl.startsWith('http')
      ? product.imageUrl
      : `${BASE_URL}${product.imageUrl}`
    : `${BASE_URL}/images/og-default.jpg`

  return (
    <>
      {/* JSON-LD Structured Data */}
      {product && (
        <>
          <ProductSchema
            name={product.name}
            brand={product.brand}
            description={
              product.description ||
              `${product.name} by ${product.brand} - ${product.concentration.replace(/_/g, ' ')}`
            }
            image={imageUrl}
            price={parseFloat(product.priceRON)}
            currency="RON"
            sku={product.id}
            availability={product.stock > 0 ? 'InStock' : 'OutOfStock'}
            url={`${BASE_URL}/${locale}/product/${slug}`}
            rating={parseFloat(product.rating) || undefined}
          />
          <BreadcrumbSchema
            items={[
              { name: 'Home', url: `${BASE_URL}/${locale}` },
              { name: 'Store', url: `${BASE_URL}/${locale}/store` },
              { name: product.name, url: `${BASE_URL}/${locale}/product/${slug}` },
            ]}
          />
        </>
      )}

      <ProductDetailClient slug={slug} />
    </>
  )
}
