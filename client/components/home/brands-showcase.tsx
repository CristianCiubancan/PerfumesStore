'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { useTranslations } from 'next-intl'

interface BrandsShowcaseProps {
  brands: string[]
}

export function BrandsShowcase({ brands }: BrandsShowcaseProps) {
  const t = useTranslations('home')
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: '-100px' })
  const [singleSetWidth, setSingleSetWidth] = useState(0)

  // Calculate how many times to repeat brands to fill the screen
  // We need at least 2 full sets, but more if brands are few
  // Guard against empty array to prevent division by zero
  const repeatCount = brands.length > 0
    ? Math.max(Math.ceil(2000 / (brands.length * 150)), 4)
    : 0
  const repeatedBrands = repeatCount > 0 ? Array(repeatCount).fill(brands).flat() : []

  useEffect(() => {
    if (trackRef.current && brands.length > 0) {
      // Measure width of one set of brands
      const totalWidth = trackRef.current.scrollWidth
      setSingleSetWidth(totalWidth / 2)
    }
  }, [brands, repeatCount])

  // Early return if no brands (after hooks)
  if (brands.length === 0) {
    return null
  }

  // Consistent scrolling speed
  const duration = Math.max(singleSetWidth / 50, 15)

  return (
    <section ref={containerRef} className="py-16 md:py-20 border-t">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <p className="text-sm text-muted-foreground uppercase tracking-widest">
            {t('brands.title')}
          </p>
        </motion.div>

        {/* Infinite scroll marquee effect */}
        <div className="relative overflow-hidden">
          <motion.div
            ref={trackRef}
            className="flex gap-16 items-center w-max"
            animate={singleSetWidth > 0 ? { x: [0, -singleSetWidth] } : {}}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: 'loop',
                duration,
                ease: 'linear',
              },
            }}
          >
            {/* Repeat brands twice (each already multiplied) for seamless loop */}
            {[...repeatedBrands, ...repeatedBrands].map((brand, index) => (
              <div
                key={index}
                className="flex-shrink-0 text-2xl md:text-3xl font-serif text-muted-foreground/50 hover:text-foreground transition-colors cursor-pointer select-none whitespace-nowrap"
              >
                {brand}
              </div>
            ))}
          </motion.div>

          {/* Gradient overlays for fade effect */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent pointer-events-none" />
        </div>
      </div>
    </section>
  )
}
