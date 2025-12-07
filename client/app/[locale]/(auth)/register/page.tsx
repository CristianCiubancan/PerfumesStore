import { Metadata } from 'next'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { RegisterClient } from './register-client'
import { Locale, locales, defaultLocale } from '@/i18n/config'
import { BASE_URL, SITE_NAME, ogLocaleMap } from '@/lib/seo'

interface Props {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const messages = await getMessages({ locale })

  // Extract auth translations
  const auth = messages.auth as {
    register: { title: string; description: string }
  }
  const title = auth?.register?.title || 'Create Account'
  const description =
    auth?.register?.description || 'Create an account to get started'

  // Generate alternate language URLs
  const languages: Record<string, string> = {}
  for (const l of locales) {
    languages[l] = `${BASE_URL}/${l}/register`
  }
  languages['x-default'] = `${BASE_URL}/${defaultLocale}/register`

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/register`,
      languages,
    },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: `${BASE_URL}/${locale}/register`,
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

export default async function RegisterPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale as Locale)

  return <RegisterClient />
}
