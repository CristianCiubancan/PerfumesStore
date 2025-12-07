import { Metadata } from 'next'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { CartPageContent } from '@/components/cart/cart-page-content'
import { Locale, locales, defaultLocale } from '@/i18n/config'
import { BASE_URL, SITE_NAME, ogLocaleMap } from '@/lib/seo'

interface Props {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const messages = await getMessages({ locale })

  // Extract cart translations
  const cart = messages.cart as { title: string }
  const title = cart?.title || 'Shopping Cart'
  const description = 'View and manage items in your shopping cart'

  // Generate alternate language URLs
  const languages: Record<string, string> = {}
  for (const l of locales) {
    languages[l] = `${BASE_URL}/${l}/cart`
  }
  languages['x-default'] = `${BASE_URL}/${defaultLocale}/cart`

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/cart`,
      languages,
    },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: `${BASE_URL}/${locale}/cart`,
      siteName: SITE_NAME,
      locale: ogLocaleMap[locale as Locale] || 'en_US',
      type: 'website',
    },
    // Cart pages should not be indexed
    robots: {
      index: false,
      follow: true,
      noarchive: true,
    },
  }
}

export default async function CartPage({ params }: Props) {
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
      <CartPageContent />
    </Suspense>
  )
}
