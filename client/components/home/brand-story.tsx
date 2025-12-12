'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { ArrowRight, Award, Shield, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/routing'

const features = [
  { icon: Award, key: 'authentic' },
  { icon: Shield, key: 'secure' },
  { icon: Truck, key: 'shipping' },
]

export function BrandStory() {
  const t = useTranslations('home')

  return (
    <section className="py-16 md:py-24 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Image side */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="aspect-[4/5] rounded-2xl overflow-hidden relative">
              <Image
                src="/images/brand-story.jpg"
                alt="Luxury perfume collection"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                loading="lazy"
              />
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-background/90 to-transparent">
                <p className="text-lg font-medium italic text-center">
                  &ldquo;{t('brandStory.quote')}&rdquo;
                </p>
              </div>
            </div>
            {/* Floating accent */}
            <motion.div
              className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/10 rounded-2xl -z-10"
              animate={{ rotate: [0, 5, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>

          {/* Content side */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
              {t('brandStory.title')}
            </h2>
            <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
              {t('brandStory.description1')}
            </p>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              {t('brandStory.description2')}
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-4 mb-8">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <motion.div
                    key={feature.key}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                    className="flex items-center gap-3 p-4 rounded-xl bg-muted/50"
                  >
                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm font-medium whitespace-nowrap">
                      {t(`brandStory.features.${feature.key}`)}
                    </span>
                  </motion.div>
                )
              })}
            </div>

            <Button size="lg" className="group" asChild>
              <Link href="/store">
                {t('brandStory.cta')}
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
