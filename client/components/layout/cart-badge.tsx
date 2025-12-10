'use client'

import { useEffect, useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/store/cart'
import { Link } from '@/i18n/routing'
import { cn } from '@/lib/utils'
import { TIMING } from '@/lib/constants'

export function CartBadge() {
  const t = useTranslations('nav')
  const getTotalItems = useCartStore((state) => state.getTotalItems)
  const [count, setCount] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const countRef = useRef(count)

  // Hydrate count on client side and sync ref
  useEffect(() => {
    const initialCount = getTotalItems()
    setCount(initialCount)
    countRef.current = initialCount
  }, [getTotalItems])

  // Subscribe to cart changes - only subscribe once on mount
  useEffect(() => {
    const unsubscribe = useCartStore.subscribe((state) => {
      const newCount = state.getTotalItems()
      if (newCount !== countRef.current) {
        setIsAnimating(true)
        setCount(newCount)
        countRef.current = newCount
        setTimeout(() => setIsAnimating(false), TIMING.BADGE_ANIMATION_MS)
      }
    })
    return unsubscribe
  }, [])

  return (
    <Link href="/cart">
      <Button variant="ghost" size="icon" className="relative">
        <ShoppingCart className="h-5 w-5" />
        {count > 0 && (
          <span
            className={cn(
              'absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center transition-transform',
              isAnimating && 'scale-125'
            )}
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
        <span className="sr-only">{t('cart')}</span>
      </Button>
    </Link>
  )
}
