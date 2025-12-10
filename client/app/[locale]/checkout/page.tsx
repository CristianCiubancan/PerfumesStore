import { Metadata } from 'next'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { CheckoutPageContent } from '@/components/checkout/checkout-page-content'
import { Locale, locales, defaultLocale } from '@/i18n/config'
import { BASE_URL, SITE_NAME, ogLocaleMap } from '@/lib/seo'

interface Props {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const messages = await getMessages({ locale })

  const checkout = messages.checkout as { title?: string } | undefined
  const title = checkout?.title || 'Checkout'
  const description = 'Complete your order'

  const languages: Record<string, string> = {}
  for (const l of locales) {
    languages[l] = `${BASE_URL}/${l}/checkout`
  }
  languages['x-default'] = `${BASE_URL}/${defaultLocale}/checkout`

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/checkout`,
      languages,
    },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: `${BASE_URL}/${locale}/checkout`,
      siteName: SITE_NAME,
      locale: ogLocaleMap[locale as Locale] || 'en_US',
      type: 'website',
    },
    robots: {
      index: false,
      follow: true,
      noarchive: true,
    },
  }
}

export default async function CheckoutPage({ params }: Props) {
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
      <CheckoutPageContent />
    </Suspense>
  )
}
