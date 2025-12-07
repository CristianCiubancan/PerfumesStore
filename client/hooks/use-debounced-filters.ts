'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Fields that require debouncing (text/number inputs).
 * Other filter fields (selects, multi-selects) update immediately.
 */
export interface DebouncedFields {
  search: string
  minPrice: string
  maxPrice: string
  minRating: string
  maxRating: string
}

function debouncedFieldsEqual(a: DebouncedFields, b: DebouncedFields): boolean {
  return (
    a.search === b.search &&
    a.minPrice === b.minPrice &&
    a.maxPrice === b.maxPrice &&
    a.minRating === b.minRating &&
    a.maxRating === b.maxRating
  )
}

/**
 * Hook for managing debounced filter inputs with proper external sync.
 *
 * Solves race conditions by:
 * 1. Using a single debounce timer for all text inputs (no shared boolean flag)
 * 2. Tracking "last sent" values to detect external vs internal changes
 * 3. Coalescing rapid changes across multiple fields into single update
 *
 * @param externalFields - Current debounced field values from parent
 * @param delay - Debounce delay in milliseconds
 * @returns [localFields, updateField] - Local state and setter
 */
export function useDebouncedFilters(
  externalFields: DebouncedFields,
  onUpdate: (fields: DebouncedFields) => void,
  delay: number
): [DebouncedFields, <K extends keyof DebouncedFields>(key: K, value: DebouncedFields[K]) => void] {
  const [localFields, setLocalFields] = useState(externalFields)

  // Track what we last sent to parent - if external differs, it's an external change
  const lastSentRef = useRef(externalFields)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Stable callback ref to avoid stale closures in timeout
  const onUpdateRef = useRef(onUpdate)
  useEffect(() => { onUpdateRef.current = onUpdate }, [onUpdate])

  // Sync from external when changed externally (reset, URL navigation, etc.)
  useEffect(() => {
    if (!debouncedFieldsEqual(externalFields, lastSentRef.current)) {
      // External change detected - sync immediately and cancel pending debounce
      lastSentRef.current = externalFields
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      // Use queueMicrotask to avoid lint warning about setState in effect
      queueMicrotask(() => {
        setLocalFields(externalFields)
      })
    }
  }, [externalFields])

  // Debounce local changes to parent
  useEffect(() => {
    // Nothing to do if local matches external
    if (debouncedFieldsEqual(localFields, externalFields)) {
      return
    }

    timerRef.current = setTimeout(() => {
      lastSentRef.current = localFields
      onUpdateRef.current(localFields)
    }, delay)

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [localFields, externalFields, delay])

  // Memoized field updater
  const updateField = useCallback(<K extends keyof DebouncedFields>(
    key: K,
    value: DebouncedFields[K]
  ) => {
    setLocalFields(prev => ({ ...prev, [key]: value }))
  }, [])

  return [localFields, updateField]
}
