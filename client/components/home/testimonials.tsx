'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const testimonials = [
  {
    key: '1',
    rating: 5,
    initials: 'MR',
  },
  {
    key: '2',
    rating: 5,
    initials: 'AA',
  },
  {
    key: '3',
    rating: 5,
    initials: 'CD',
  },
  {
    key: '4',
    rating: 5,
    initials: 'EP',
  },
]

export function Testimonials() {
  const t = useTranslations('home')
  const [current, setCurrent] = useState(0)

  const next = () => setCurrent((prev) => (prev + 1) % testimonials.length)
  const prev = () =>
    setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length)

  return (
    <section className="py-16 md:py-24" aria-labelledby="testimonials-heading">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 id="testimonials-heading" className="text-3xl md:text-4xl font-bold tracking-tight">
            {t('testimonials.title')}
          </h2>
          <p className="text-muted-foreground mt-2">
            {t('testimonials.subtitle')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-3xl mx-auto"
          role="region"
          aria-roledescription={t('testimonials.aria.carousel')}
          aria-label={t('testimonials.aria.carouselLabel')}
        >
          <div className="relative">
            <Quote className="absolute -top-4 -left-4 w-16 h-16 text-primary/10" aria-hidden="true" />

            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="text-center px-8 py-6"
                role="group"
                aria-roledescription={t('testimonials.aria.slide')}
                aria-label={t('testimonials.aria.slideLabel', { current: current + 1, total: testimonials.length })}
                aria-live="polite"
              >
                {/* Stars */}
                <div
                  className="flex justify-center gap-1 mb-6"
                  role="img"
                  aria-label={t('testimonials.aria.rating', { rating: testimonials[current].rating })}
                >
                  {Array.from({ length: testimonials[current].rating }).map(
                    (_, i) => (
                      <Star
                        key={i}
                        className="w-5 h-5 fill-yellow-400 text-yellow-400"
                        aria-hidden="true"
                      />
                    )
                  )}
                </div>

                {/* Quote */}
                <p className="text-lg md:text-xl text-muted-foreground italic mb-6 leading-relaxed">
                  &ldquo;{t(`testimonials.reviews.${testimonials[current].key}.text`)}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    {testimonials[current].initials}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">
                      {t(`testimonials.reviews.${testimonials[current].key}.name`)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t(`testimonials.reviews.${testimonials[current].key}.product`)}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <nav
              className="flex items-center justify-center gap-4 mt-8"
              aria-label={t('testimonials.aria.navigation')}
            >
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={prev}
                aria-label={t('testimonials.aria.previous')}
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              </Button>

              <div className="flex gap-2" role="tablist" aria-label={t('testimonials.aria.indicators')}>
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    role="tab"
                    onClick={() => setCurrent(index)}
                    aria-selected={index === current}
                    aria-label={t('testimonials.aria.goToSlide', { slide: index + 1 })}
                    className={cn(
                      'w-2 h-2 rounded-full transition-all',
                      index === current
                        ? 'bg-primary w-6'
                        : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    )}
                  />
                ))}
              </div>

              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={next}
                aria-label={t('testimonials.aria.next')}
              >
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </Button>
            </nav>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
