'use client'

import * as React from 'react'
import { ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface MultiSelectOption {
  value: string
  label: string
  count?: number
  disabled?: boolean
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  /** Show counts next to option labels */
  showCounts?: boolean
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select...',
  className,
  disabled = false,
  showCounts = false,
}: MultiSelectProps) {
  const toggleOption = (value: string, optionDisabled?: boolean) => {
    // Don't toggle if the option is disabled
    if (optionDisabled) return

    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const handleBadgePointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const removeOption = (value: string) => {
    onChange(selected.filter((v) => v !== value))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn('w-full justify-between font-normal h-auto min-h-9', className)}
          disabled={disabled}
        >
          <div className="flex flex-wrap gap-1 flex-1 text-left py-1">
            {selected.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selected.map((value) => {
                const option = options.find((o) => o.value === value)
                return (
                  <span
                    key={value}
                    role="button"
                    tabIndex={-1}
                    className="inline-flex items-center text-xs h-6 px-2 gap-1 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-pointer"
                    onPointerDown={handleBadgePointerDown}
                    onClick={() => removeOption(value)}
                    aria-label={`Remove ${option?.label || value}`}
                  >
                    {option?.label || value}
                    <X className="h-3 w-3" aria-hidden="true" />
                  </span>
                )
              })
            )}
          </div>
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]" align="start">
        {options.map((option) => {
          const isSelected = selected.includes(option.value)
          const isOptionDisabled = option.disabled || (option.count === 0 && !isSelected)
          const displayLabel = showCounts && option.count !== undefined && !isSelected
            ? `${option.label} (${option.count})`
            : option.label

          return (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={selected.includes(option.value)}
              onCheckedChange={() => toggleOption(option.value, isOptionDisabled)}
              onSelect={(e) => e.preventDefault()}
              disabled={isOptionDisabled}
              className={isOptionDisabled ? '!opacity-50 !cursor-not-allowed !text-muted-foreground' : ''}
            >
              {displayLabel}
            </DropdownMenuCheckboxItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
