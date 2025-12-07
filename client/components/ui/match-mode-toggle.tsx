'use client'

import { cn } from '@/lib/utils'

interface MatchModeToggleProps {
  value: 'any' | 'all'
  onChange: (value: 'any' | 'all') => void
  anyLabel?: string
  allLabel?: string
  className?: string
}

export function MatchModeToggle({
  value,
  onChange,
  anyLabel = 'Any',
  allLabel = 'All',
  className,
}: MatchModeToggleProps) {
  return (
    <div className={cn('inline-flex rounded-md border bg-muted p-0.5 text-xs', className)}>
      <button
        type="button"
        onClick={() => onChange('any')}
        className={cn(
          'px-2 py-0.5 rounded-sm transition-colors',
          value === 'any'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        {anyLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange('all')}
        className={cn(
          'px-2 py-0.5 rounded-sm transition-colors',
          value === 'all'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        {allLabel}
      </button>
    </div>
  )
}
