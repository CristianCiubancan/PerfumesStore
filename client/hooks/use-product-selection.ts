/**
 * Hook for managing product selection state (bulk actions)
 */
import { useState, useCallback } from 'react'

export interface UseProductSelectionResult {
  selectedIds: Set<number>
  selectAll: boolean
  handleSelectAll: (checked: boolean, productIds: number[]) => void
  handleSelectProduct: (id: number, checked: boolean, totalProducts: number) => void
  clearSelection: () => void
}

export function useProductSelection(): UseProductSelectionResult {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [selectAll, setSelectAll] = useState(false)

  const handleSelectAll = useCallback((checked: boolean, productIds: number[]) => {
    setSelectAll(checked)
    setSelectedIds(checked ? new Set(productIds) : new Set())
  }, [])

  const handleSelectProduct = useCallback(
    (id: number, checked: boolean, totalProducts: number) => {
      setSelectedIds((prev) => {
        const newSelected = new Set(prev)
        if (checked) {
          newSelected.add(id)
        } else {
          newSelected.delete(id)
        }
        setSelectAll(newSelected.size === totalProducts && totalProducts > 0)
        return newSelected
      })
    },
    []
  )

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
    setSelectAll(false)
  }, [])

  return {
    selectedIds,
    selectAll,
    handleSelectAll,
    handleSelectProduct,
    clearSelection,
  }
}
