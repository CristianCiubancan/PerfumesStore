'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Sparkles, ArrowRight, Flower2, TreePine, Citrus, Wind } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/routing'

const fragranceFamilies = [
  { icon: Flower2, key: 'floral', href: '/store?fragranceFamilyId=1' },
  { icon: TreePine, key: 'woody', href: '/store?fragranceFamilyId=3' },
  { icon: Citrus, key: 'fresh', href: '/store?fragranceFamilyId=4' },
  { icon: Wind, key: 'oriental', href: '/store?fragranceFamilyId=2' },
]

export function FragranceFinder() {
  const t = useTranslations('home')

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            {t('fragranceFinder.badge')}
          </div>

          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            {t('fragranceFinder.title')}
          </h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-2xl mx-auto">
            {t('fragranceFinder.subtitle')}
          </p>

          {/* Fragrance family quick links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {fragranceFamilies.map((family, index) => {
              const Icon = family.icon
              return (
                <motion.div
                  key={family.key}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                >
                  <Link
                    href={family.href}
                    className="group block p-6 rounded-2xl border bg-card hover:border-primary/30 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-1">
                      {t(`fragranceFinder.families.${family.key}.title`)}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {t(`fragranceFinder.families.${family.key}.description`)}
                    </p>
                  </Link>
                </motion.div>
              )
            })}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Button size="lg" className="group" asChild>
              <Link href="/store">
                {t('fragranceFinder.cta')}
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
