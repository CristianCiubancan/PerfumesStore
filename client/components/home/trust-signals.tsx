'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import {
  Shield,
  Truck,
  RotateCcw,
  Headphones,
  Award,
  CreditCard,
} from 'lucide-react'

const trustItems = [
  { icon: Shield, key: 'authentic' },
  { icon: Truck, key: 'shipping' },
  { icon: RotateCcw, key: 'returns' },
  { icon: Headphones, key: 'support' },
  { icon: Award, key: 'quality' },
  { icon: CreditCard, key: 'payment' },
]

export function TrustSignals() {
  const t = useTranslations('home')

  return (
    <section className="py-16 md:py-24 border-y bg-muted/20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            {t('trustSignals.title')}
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {trustItems.map((item, index) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-semibold text-sm mb-1">
                  {t(`trustSignals.items.${item.key}.title`)}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t(`trustSignals.items.${item.key}.description`)}
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
