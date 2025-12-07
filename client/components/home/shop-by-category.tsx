'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { ArrowRight } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { cn } from '@/lib/utils'

interface CategoryCard {
  key: string
  href: string
  gradient: string
}

const categories: CategoryCard[] = [
  {
    key: 'women',
    href: '/store?gender=Women',
    gradient: 'from-pink-500/20 via-rose-500/10 to-transparent',
  },
  {
    key: 'men',
    href: '/store?gender=Men',
    gradient: 'from-blue-500/20 via-indigo-500/10 to-transparent',
  },
  {
    key: 'unisex',
    href: '/store?gender=Unisex',
    gradient: 'from-purple-500/20 via-violet-500/10 to-transparent',
  },
  {
    key: 'edp',
    href: '/store?concentration=Eau_de_Parfum',
    gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
  },
  {
    key: 'edt',
    href: '/store?concentration=Eau_de_Toilette',
    gradient: 'from-teal-500/20 via-cyan-500/10 to-transparent',
  },
  {
    key: 'niche',
    href: '/store?concentration=Extrait_de_Parfum',
    gradient: 'from-yellow-500/20 via-amber-500/10 to-transparent',
  },
]

export function ShopByCategory() {
  const t = useTranslations('home')

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            {t('categories.title')}
          </h2>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            {t('categories.subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.key}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="h-full"
            >
              <Link
                href={category.href}
                className={cn(
                  'group relative flex flex-col h-full overflow-hidden rounded-2xl border bg-card p-6 md:p-8',
                  'transition-all duration-300 hover:shadow-lg hover:border-primary/20'
                )}
              >
                <div
                  className={cn(
                    'absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity group-hover:opacity-100',
                    category.gradient
                  )}
                />
                <div className="relative z-10 flex flex-col flex-1">
                  <h3 className="font-semibold text-lg md:text-xl mb-1">
                    {t(`categories.${category.key}.title`)}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 flex-1">
                    {t(`categories.${category.key}.description`)}
                  </p>
                  <span className="inline-flex items-center text-sm font-medium text-primary mt-auto">
                    {t('categories.shopNow')}
                    <ArrowRight className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
