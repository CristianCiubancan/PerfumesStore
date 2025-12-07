import { Metadata } from 'next'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { StorePageClient } from './store-client'
import { locales, defaultLocale, Locale } from '@/i18n/config'
import { BASE_URL, SITE_NAME, ogLocaleMap } from '@/lib/seo'
import { OG_IMAGE } from '@/lib/constants'

interface Props {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const messages = await getMessages({ locale })

  // Extract store translations
  const store = messages.store as { title: string; subtitle: string }
  const title = store?.title || 'Our Collection'
  const description =
    store?.subtitle ||
    'Browse our curated selection of luxury fragrances from the world\'s finest brands'

  // Generate alternate language URLs
  const languages: Record<string, string> = {}
  for (const l of locales) {
    languages[l] = `${BASE_URL}/${l}/store`
  }
  languages['x-default'] = `${BASE_URL}/${defaultLocale}/store`

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/store`,
      languages,
    },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: `${BASE_URL}/${locale}/store`,
      siteName: SITE_NAME,
      locale: ogLocaleMap[locale as Locale] || 'en_US',
      alternateLocale: locales
        .filter((l) => l !== locale)
        .map((l) => ogLocaleMap[l]),
      type: 'website',
      images: [
        {
          url: `${BASE_URL}/images/og-store.jpg`,
          width: OG_IMAGE.WIDTH,
          height: OG_IMAGE.HEIGHT,
          alt: `${SITE_NAME} - ${title}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [`${BASE_URL}/images/og-store.jpg`],
    },
  }
}

export default async function StorePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale as Locale)

  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <StorePageClient />
    </Suspense>
  )
}
