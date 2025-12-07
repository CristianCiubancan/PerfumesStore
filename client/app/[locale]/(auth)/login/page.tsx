import { Metadata } from 'next'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { LoginClient } from './login-client'
import { Locale, locales, defaultLocale } from '@/i18n/config'
import { BASE_URL, SITE_NAME, ogLocaleMap } from '@/lib/seo'

interface Props {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const messages = await getMessages({ locale })

  // Extract auth translations
  const auth = messages.auth as { login: { title: string; description: string } }
  const title = auth?.login?.title || 'Sign In'
  const description = auth?.login?.description || 'Sign in to your account'

  // Generate alternate language URLs
  const languages: Record<string, string> = {}
  for (const l of locales) {
    languages[l] = `${BASE_URL}/${l}/login`
  }
  languages['x-default'] = `${BASE_URL}/${defaultLocale}/login`

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/login`,
      languages,
    },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: `${BASE_URL}/${locale}/login`,
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

export default async function LoginPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale as Locale)

  return <LoginClient />
}
