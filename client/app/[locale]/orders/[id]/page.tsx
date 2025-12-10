import { Metadata } from 'next'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { OrderDetailContent } from '@/components/orders/order-detail-content'
import { Locale } from '@/i18n/config'
import { SITE_NAME, ogLocaleMap } from '@/lib/seo'

interface Props {
  params: Promise<{ locale: string; id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params
  const messages = await getMessages({ locale })

  const orderDetail = messages.orderDetail as { title?: string } | undefined
  const title = orderDetail?.title || 'Order Details'

  return {
    title: `${title} #${id}`,
    description: `Order details for order #${id}`,
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
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

export default async function OrderDetailPage({ params }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale as Locale)

  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <OrderDetailContent orderId={parseInt(id, 10)} />
    </Suspense>
  )
}
