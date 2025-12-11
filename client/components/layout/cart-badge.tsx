'use client'

import { useEffect, useState, useRef, useCallback, useSyncExternalStore } from 'react'
import { useTranslations } from 'next-intl'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/store/cart'
import { Link } from '@/i18n/routing'
import { cn } from '@/lib/utils'
import { TIMING } from '@/lib/constants'

// Helper to get cart count from store
const getCartCount = () => useCartStore.getState().getTotalItems()

export function CartBadge() {
  const t = useTranslations('nav')
  const [isAnimating, setIsAnimating] = useState(false)
  const countRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Subscription callback that handles both state sync and animation
  const subscribe = useCallback((onStoreChange: () => void) => {
    return useCartStore.subscribe(() => {
      const newCount = getCartCount()
      if (newCount !== countRef.current) {
        countRef.current = newCount
        // Trigger animation in subscription callback (external state change)
        setIsAnimating(true)
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => setIsAnimating(false), TIMING.BADGE_ANIMATION_MS)
      }
      onStoreChange()
    })
  }, [])

  // Use useSyncExternalStore for hydration-safe subscription
  const count = useSyncExternalStore(subscribe, getCartCount, () => 0)

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
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
