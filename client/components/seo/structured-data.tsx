import { env } from '@/lib/env'

const BASE_URL = env.siteUrl
const SITE_NAME = env.siteName

// Organization Schema for the website
export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: BASE_URL,
    logo: `${BASE_URL}/images/logo.png`,
    sameAs: [
      // Add social media URLs when available
      // 'https://www.facebook.com/perfumesstore',
      // 'https://www.instagram.com/perfumesstore',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['Romanian', 'English', 'German', 'French', 'Spanish'],
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// WebSite Schema with search action
export function WebSiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: BASE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/en/store?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// Store/LocalBusiness Schema
export function StoreSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: SITE_NAME,
    url: BASE_URL,
    image: `${BASE_URL}/images/og-default.jpg`,
    priceRange: '$$',
    description: 'Your destination for luxury fragrances and authentic perfumes',
    // Add address when available
    // address: {
    //   '@type': 'PostalAddress',
    //   streetAddress: '123 Perfume Street',
    //   addressLocality: 'Bucharest',
    //   addressCountry: 'RO',
    // },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// Product Schema
interface ProductSchemaProps {
  name: string
  brand: string
  description: string
  image: string
  price: number
  currency?: string
  sku: string | number
  availability: 'InStock' | 'OutOfStock' | 'LimitedAvailability'
  url: string
  rating?: number
  reviewCount?: number
}

export function ProductSchema({
  name,
  brand,
  description,
  image,
  price,
  currency = 'RON',
  sku,
  availability,
  url,
  rating,
  reviewCount,
}: ProductSchemaProps) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image,
    sku: String(sku),
    brand: {
      '@type': 'Brand',
      name: brand,
    },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: currency,
      price: price.toFixed(2),
      availability: `https://schema.org/${availability}`,
      seller: {
        '@type': 'Organization',
        name: SITE_NAME,
      },
    },
  }

  // Add aggregate rating if available
  if (rating && rating > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating.toFixed(1),
      bestRating: '5',
      worstRating: '1',
      reviewCount: reviewCount || 1,
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// BreadcrumbList Schema
interface BreadcrumbItem {
  name: string
  url: string
}

export function BreadcrumbSchema({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// ItemList Schema for product collections
interface ProductListItem {
  name: string
  url: string
  image: string
  price: number
  currency?: string
}

export function ProductListSchema({
  name,
  description,
  items,
}: {
  name: string
  description: string
  items: ProductListItem[]
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    description,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: item.name,
        url: item.url,
        image: item.image,
        offers: {
          '@type': 'Offer',
          price: item.price.toFixed(2),
          priceCurrency: item.currency || 'RON',
        },
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// FAQ Schema (useful for product pages with Q&A)
interface FAQItem {
  question: string
  answer: string
}

export function FAQSchema({ items }: { items: FAQItem[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
