'use client'

import { useState, useEffect } from 'react'
import { productsApi } from '@/lib/api/products'
import { FilterOptions } from '@/types'

export type { FilterOptions }

export function useFilterOptions() {
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null)
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)

  useEffect(() => {
    let mounted = true

    productsApi.getFilterOptions()
      .then((options) => {
        if (mounted) {
          setFilterOptions(options)
        }
      })
      .catch((error) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to load filter options:', error)
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoadingOptions(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [])

  return { filterOptions, isLoadingOptions }
}
