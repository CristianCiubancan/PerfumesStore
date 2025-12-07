import { Suspense } from 'react'
import { setRequestLocale } from 'next-intl/server'
import { HomePage } from './home-content'
import { OrganizationSchema, WebSiteSchema, StoreSchema } from '@/components/seo/structured-data'
import { Locale } from '@/i18n/config'

interface Props {
  params: Promise<{ locale: string }>
}

export default async function Home({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale as Locale)

  return (
    <>
      {/* JSON-LD Structured Data for Home Page */}
      <OrganizationSchema />
      <WebSiteSchema />
      <StoreSchema />

      <Suspense fallback={<HomeLoading />}>
        <HomePage />
      </Suspense>
    </>
  )
}

function HomeLoading() {
  return (
    <div className="flex-1 flex items-center justify-center py-12">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  )
}
