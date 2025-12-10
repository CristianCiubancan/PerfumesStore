import { Metadata } from 'next'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { CheckoutSuccessContent } from '@/components/checkout/checkout-success-content'
import { Locale } from '@/i18n/config'
import { BASE_URL, SITE_NAME, ogLocaleMap } from '@/lib/seo'

interface Props {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const messages = await getMessages({ locale })

  const orderSuccess = messages.orderSuccess as { title?: string } | undefined
  const title = orderSuccess?.title || 'Order Confirmed'
  const description = 'Thank you for your order'

  return {
    title,
    description,
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: `${BASE_URL}/${locale}/checkout/success`,
      siteName: SITE_NAME,
      locale: ogLocaleMap[locale as Locale] || 'en_US',
      type: 'website',
    },
    robots: {
      index: false,
      follow: false,
      noarchive: true,
    },
  }
}

export default async function CheckoutSuccessPage({ params }: Props) {
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
      <CheckoutSuccessContent />
    </Suspense>
  )
}
