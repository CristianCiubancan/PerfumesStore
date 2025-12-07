'use client'

import { Minus, Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface QuantitySelectorProps {
  value: number
  min?: number
  max: number
  onChange: (value: number) => void
  disabled?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export function QuantitySelector({
  value,
  min = 1,
  max,
  onChange,
  disabled = false,
  size = 'md',
  className,
}: QuantitySelectorProps) {
  const t = useTranslations('common')
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1)
    }
  }

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10)
    if (!isNaN(newValue)) {
      if (newValue < min) {
        onChange(min)
      } else if (newValue > max) {
        onChange(max)
      } else {
        onChange(newValue)
      }
    }
  }

  const buttonSize = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'
  const inputSize = size === 'sm' ? 'h-8 w-12' : 'h-10 w-14'
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={buttonSize}
        onClick={handleDecrement}
        disabled={disabled || value <= min}
      >
        <Minus className={iconSize} />
        <span className="sr-only">{t('decreaseQuantity')}</span>
      </Button>
      <Input
        type="number"
        value={value}
        onChange={handleInputChange}
        disabled={disabled}
        min={min}
        max={max}
        className={cn(inputSize, 'text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none')}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={buttonSize}
        onClick={handleIncrement}
        disabled={disabled || value >= max}
      >
        <Plus className={iconSize} />
        <span className="sr-only">{t('increaseQuantity')}</span>
      </Button>
    </div>
  )
}
