'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Gift, Clock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/routing'
import { promotionsApi } from '@/lib/api/promotions'
import { Promotion } from '@/types'
import { TIME_MS, TIMING } from '@/lib/constants'

export function SpecialOffer() {
  const t = useTranslations('home')

  const [promotion, setPromotion] = useState<Promotion | null>(null)
  const [serverTime, setServerTime] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  // Fetch active promotion from server
  useEffect(() => {
    let cancelled = false
    promotionsApi.getActive()
      .then((data) => {
        if (!cancelled) {
          setPromotion(data.promotion)
          setServerTime(new Date(data.serverTime))
        }
      })
      .catch(() => {
        // Promotion fetch failed - component will show loading then nothing
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [])

  // Calculate time left based on server time
  const calculateTimeLeft = useCallback(() => {
    if (!promotion || !serverTime) return

    const endDate = new Date(promotion.endDate)
    // Adjust for time elapsed since serverTime was fetched
    const now = new Date()
    const timeSinceFetch = now.getTime() - serverTime.getTime()
    const adjustedNow = new Date(serverTime.getTime() + timeSinceFetch)
    const distance = endDate.getTime() - adjustedNow.getTime()

    if (distance > 0) {
      setTimeLeft({
        days: Math.floor(distance / TIME_MS.DAY),
        hours: Math.floor((distance % TIME_MS.DAY) / TIME_MS.HOUR),
        minutes: Math.floor((distance % TIME_MS.HOUR) / TIME_MS.MINUTE),
        seconds: Math.floor((distance % TIME_MS.MINUTE) / TIME_MS.SECOND),
      })
    } else {
      setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
    }
  }, [promotion, serverTime])

  // Update countdown every second
  useEffect(() => {
    if (!promotion || !serverTime) return

    // Initial calculation via timeout to avoid lint warning
    const initialTimer = setTimeout(calculateTimeLeft, 0)
    const timer = setInterval(calculateTimeLeft, TIMING.COUNTDOWN_INTERVAL_MS)

    return () => {
      clearTimeout(initialTimer)
      clearInterval(timer)
    }
  }, [promotion, serverTime, calculateTimeLeft])

  // Don't render if no active promotion
  if (isLoading) {
    return (
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="h-64 rounded-3xl bg-muted animate-pulse" />
        </div>
      </section>
    )
  }

  if (!promotion) {
    return null
  }

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border"
        >
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-0 w-40 h-40 bg-primary rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-60 h-60 bg-primary rounded-full translate-x-1/3 translate-y-1/3" />
          </div>

          <div className="relative z-10 p-8 md:p-12 lg:p-16">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    <Gift className="w-4 h-4" />
                    {t('specialOffer.badge')}
                  </div>
                  {/* Mobile/Tablet discount badge */}
                  <div className="lg:hidden inline-flex items-center px-4 py-2 rounded-full border-2 border-dashed border-primary/30 bg-background">
                    <span className="text-xl font-bold text-primary">{promotion.discountPercent}%</span>
                    <span className="ml-1.5 text-xs font-medium text-muted-foreground uppercase">
                      {t('specialOffer.off')}
                    </span>
                  </div>
                </div>

                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                  {promotion.name}
                </h2>
                <p className="text-muted-foreground text-lg mb-6">
                  {t('specialOffer.description')}
                </p>

                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                  <Clock className="w-4 h-4" />
                  {t('specialOffer.endsIn')}
                </div>

                {/* Countdown */}
                <div className="flex gap-3 mb-8">
                  {[
                    { value: timeLeft.days, label: t('specialOffer.days') },
                    { value: timeLeft.hours, label: t('specialOffer.hours') },
                    { value: timeLeft.minutes, label: t('specialOffer.minutes') },
                    { value: timeLeft.seconds, label: t('specialOffer.seconds') },
                  ].map((item, index) => (
                    <div key={index} className="text-center">
                      <div className="w-16 h-16 rounded-xl bg-background border flex items-center justify-center text-2xl font-bold">
                        {String(item.value).padStart(2, '0')}
                      </div>
                      <span className="text-xs text-muted-foreground mt-1 block">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>

                <Button size="lg" className="group" asChild>
                  <Link href="/store">
                    {t('specialOffer.cta')}
                    <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>

              {/* Discount visual */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="hidden lg:flex items-center justify-center"
              >
                <div className="relative">
                  <div className="w-64 h-64 rounded-full border-4 border-dashed border-primary/30 flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-6xl font-bold text-primary">{promotion.discountPercent}%</span>
                      <span className="block text-xl font-medium text-muted-foreground mt-1">
                        {t('specialOffer.off')}
                      </span>
                    </div>
                  </div>
                  <motion.div
                    className="absolute -top-4 -right-4 w-20 h-20 bg-primary/10 rounded-full"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: TIMING.PULSE_ANIMATION_DURATION_S, repeat: Infinity }}
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
