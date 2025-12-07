import { MetadataRoute } from 'next'
import { env } from '@/lib/env'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = env.siteUrl

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/*/admin',
          '/api/',
          '/cart',
          '/*/cart',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
