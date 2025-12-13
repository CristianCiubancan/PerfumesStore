'use client'

import { memo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ShoppingCart, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/store/cart'
import { Product } from '@/types'
import { cn } from '@/lib/utils'
import { TIMING } from '@/lib/constants'

interface AddToCartButtonProps {
  product: Product
  quantity?: number
  variant?: 'default' | 'icon' | 'full'
  className?: string
  showQuantityInCart?: boolean
}

export const AddToCartButton = memo(function AddToCartButton({
  product,
  quantity = 1,
  variant = 'default',
  className,
  showQuantityInCart = true,
}: AddToCartButtonProps) {
  const t = useTranslations('cart')
  const [isAdding, setIsAdding] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  const { addItem, isInCart, getItemQuantity } = useCartStore()

  const inCart = isInCart(product.id)
  const quantityInCart = getItemQuantity(product.id)
  const isOutOfStock = product.stock === 0

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isOutOfStock) return

    setIsAdding(true)

    // Simulate slight delay for better UX
    await new Promise(resolve => setTimeout(resolve, TIMING.ADD_TO_CART_DELAY_MS))

    const result = addItem(product, quantity)

    setIsAdding(false)

    if (result.success) {
      setJustAdded(true)
      toast.success(t('toast.added', { name: product.name }))
      setTimeout(() => setJustAdded(false), TIMING.ADD_TO_CART_FEEDBACK_MS)
    } else {
      if (result.message === 'STOCK_EXCEEDED') {
        toast.error(t('toast.stockExceeded', { stock: product.stock }))
      } else if (result.message === 'OUT_OF_STOCK') {
        toast.error(t('toast.outOfStock'))
      }
    }
  }

  if (isOutOfStock) {
    return (
      <Button
        variant="secondary"
        className={cn('cursor-not-allowed opacity-50', className)}
        disabled
      >
        {t('addToCart.outOfStock')}
      </Button>
    )
  }

  if (variant === 'icon') {
    const srOnlyText = isAdding
      ? t('addToCart.adding')
      : justAdded
      ? t('addToCart.added')
      : t('addToCart.add')

    return (
      <Button
        variant={inCart ? 'secondary' : 'default'}
        size="icon"
        className={className}
        onClick={handleAddToCart}
        disabled={isAdding}
      >
        {isAdding ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : justAdded ? (
          <Check className="h-4 w-4" />
        ) : (
          <ShoppingCart className="h-4 w-4" />
        )}
        <span className="sr-only">{srOnlyText}</span>
      </Button>
    )
  }

  const buttonText = isAdding
    ? t('addToCart.adding')
    : justAdded
    ? t('addToCart.added')
    : inCart && showQuantityInCart
    ? t('addToCart.inCart', { quantity: quantityInCart })
    : t('addToCart.add')

  return (
    <Button
      variant={inCart && !justAdded ? 'secondary' : 'default'}
      className={cn(variant === 'full' && 'w-full', className)}
      onClick={handleAddToCart}
      disabled={isAdding}
      data-testid="add-to-cart"
    >
      {isAdding ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : justAdded ? (
        <Check className="mr-2 h-4 w-4" />
      ) : (
        <ShoppingCart className="mr-2 h-4 w-4" />
      )}
      {buttonText}
    </Button>
  )
})

AddToCartButton.displayName = 'AddToCartButton'
