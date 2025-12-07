'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductCard } from '@/components/store/product-card'
import { Link } from '@/i18n/routing'
import { Product } from '@/types'

interface FeaturedProductsProps {
  products: Product[]
  title?: string
  subtitle?: string
  showViewAll?: boolean
}

export function FeaturedProducts({
  products,
  title,
  subtitle,
  showViewAll = true,
}: FeaturedProductsProps) {
  const t = useTranslations('home')
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  if (!products.length) return null

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8"
        >
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              {title || t('featured.title')}
            </h2>
            <p className="text-muted-foreground mt-2">
              {subtitle || t('featured.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={() => scroll('left')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={() => scroll('right')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            {showViewAll && (
              <Button variant="ghost" className="ml-2 group" asChild>
                <Link href="/store?sortBy=newest&sortOrder=desc">
                  {t('featured.viewAll')}
                  <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            )}
          </div>
        </motion.div>

        <div className="relative">
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto overflow-y-hidden pb-4 scrollbar-hide snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex-shrink-0 w-[280px] snap-start"
              >
                <ProductCard product={product} priority={index === 0} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
