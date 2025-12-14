import { Metadata } from 'next'
import { Suspense } from 'react'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { ResetPasswordClient } from './reset-password-client'
import { Locale, locales, defaultLocale } from '@/i18n/config'
import { BASE_URL, SITE_NAME, ogLocaleMap } from '@/lib/seo'

interface Props {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const messages = await getMessages({ locale })

  // Extract auth translations
  const auth = messages.auth as { resetPassword: { title: string; description: string } }
  const title = auth?.resetPassword?.title || 'Reset Password'
  const description = auth?.resetPassword?.description || 'Create a new password'

  // Generate alternate language URLs
  const languages: Record<string, string> = {}
  for (const l of locales) {
    languages[l] = `${BASE_URL}/${l}/reset-password`
  }
  languages['x-default'] = `${BASE_URL}/${defaultLocale}/reset-password`

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/reset-password`,
      languages,
    },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: `${BASE_URL}/${locale}/reset-password`,
      siteName: SITE_NAME,
      locale: ogLocaleMap[locale as Locale] || 'en_US',
      type: 'website',
    },
    // Auth pages should not be indexed
    robots: {
      index: false,
      follow: true,
    },
  }
}

function ResetPasswordFallback() {
  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-background to-muted px-4 py-8">
      <div className="w-full max-w-md animate-pulse">
        <div className="h-8 bg-muted rounded w-1/2 mx-auto mb-4" />
        <div className="h-4 bg-muted rounded w-3/4 mx-auto" />
      </div>
    </div>
  )
}

export default async function ResetPasswordPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale as Locale)

  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordClient />
    </Suspense>
  )
}
