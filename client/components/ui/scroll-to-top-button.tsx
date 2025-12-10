'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ScrollToTopButtonProps {
  /** ID of a scrollable container element. If not provided, uses window scroll. */
  scrollContainerId?: string
  /** Scroll threshold in pixels before showing the button */
  threshold?: number
  /** Additional CSS classes */
  className?: string
}

export function ScrollToTopButton({
  scrollContainerId,
  threshold = 300,
  className,
}: ScrollToTopButtonProps) {
  const [isVisible, setIsVisible] = useState(false)

  const checkScrollPosition = useCallback(() => {
    const scrollElement = scrollContainerId
      ? document.getElementById(scrollContainerId)
      : null

    const scrollTop = scrollElement
      ? scrollElement.scrollTop
      : window.scrollY

    setIsVisible(scrollTop > threshold)
  }, [scrollContainerId, threshold])

  useEffect(() => {
    const scrollElement = scrollContainerId
      ? document.getElementById(scrollContainerId)
      : window

    if (!scrollElement) return

    // Check initial position
    checkScrollPosition()

    scrollElement.addEventListener('scroll', checkScrollPosition, { passive: true })

    return () => {
      scrollElement.removeEventListener('scroll', checkScrollPosition)
    }
  }, [scrollContainerId, checkScrollPosition])

  const scrollToTop = useCallback(() => {
    const scrollElement = scrollContainerId
      ? document.getElementById(scrollContainerId)
      : null

    if (scrollElement) {
      scrollElement.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [scrollContainerId])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'fixed bottom-6 right-6 z-50',
            className
          )}
        >
          <Button
            variant="outline"
            size="icon"
            onClick={scrollToTop}
            className="size-12 rounded-full shadow-lg hover:shadow-xl transition-shadow bg-background/80 backdrop-blur-sm"
            aria-label="Scroll to top"
          >
            <ArrowUp className="size-5" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
