import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Providers } from "@/providers";
import { Header } from "@/components/layout/header";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/error-boundary";
import { routing } from "@/i18n/routing";
import { locales, defaultLocale, Locale } from "@/i18n/config";
import { BASE_URL, SITE_NAME, ogLocaleMap } from "@/lib/seo";
import { OG_IMAGE } from "@/lib/constants";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getMessages({ locale });
  const metadata = messages.metadata as {
    title: string;
    description: string;
    keywords?: string;
  };

  const title = metadata?.title || SITE_NAME;
  const description =
    metadata?.description || "Your destination for luxury fragrances";

  // Generate alternate language URLs for hreflang
  const languages: Record<string, string> = {};
  for (const l of locales) {
    languages[l] = `${BASE_URL}/${l}`;
  }
  languages["x-default"] = `${BASE_URL}/${defaultLocale}`;

  return {
    title: {
      default: title,
      template: `%s | ${SITE_NAME}`,
    },
    description,
    keywords: metadata?.keywords || [
      "perfume",
      "fragrance",
      "luxury perfume",
      "eau de parfum",
      "eau de toilette",
      "designer fragrance",
      "niche perfume",
    ],
    authors: [{ name: SITE_NAME }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: `${BASE_URL}/${locale}`,
      languages,
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}`,
      siteName: SITE_NAME,
      locale: ogLocaleMap[locale as Locale] || "en_US",
      alternateLocale: locales
        .filter((l) => l !== locale)
        .map((l) => ogLocaleMap[l]),
      type: "website",
      images: [
        {
          url: `${BASE_URL}/images/og-default.jpg`,
          width: OG_IMAGE.WIDTH,
          height: OG_IMAGE.HEIGHT,
          alt: `${SITE_NAME} - Luxury Fragrances`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${BASE_URL}/images/og-default.jpg`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    verification: {
      // Add your verification codes here when available
      // google: 'your-google-verification-code',
      // yandex: 'your-yandex-verification-code',
    },
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: SITE_NAME,
    },
    formatDetection: {
      telephone: false,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();
  const tError = await getTranslations("error");

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <div className="relative min-h-screen flex flex-col">
              <Header />
              <main className="flex-1">
                <ErrorBoundary
                  fallbackTitle={tError("title")}
                  fallbackMessage={tError("description")}
                  fallbackButtonText={tError("tryAgain")}
                >
                  {children}
                </ErrorBoundary>
              </main>
            </div>
            <Toaster />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
