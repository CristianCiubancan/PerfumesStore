'use client'

import * as React from 'react'
import { ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
// Badge import removed - using Button for keyboard accessibility (FE-002)
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface MultiSelectOption {
  value: string
  label: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select...',
  className,
  disabled = false,
}: MultiSelectProps) {
  const toggleOption = (value: string) => {
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
                  <Button
                    key={value}
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="text-xs h-6 px-2 gap-1"
                    onPointerDown={handleBadgePointerDown}
                    onClick={() => removeOption(value)}
                    aria-label={`Remove ${option?.label || value}`}
                  >
                    {option?.label || value}
                    <X className="h-3 w-3" aria-hidden="true" />
                  </Button>
                )
              })
            )}
          </div>
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]" align="start">
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={selected.includes(option.value)}
            onCheckedChange={() => toggleOption(option.value)}
            onSelect={(e) => e.preventDefault()}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
