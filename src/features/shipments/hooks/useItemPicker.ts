import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { CatalogItem } from '@/api/types'

type ItemPickerOptions = {
  items: CatalogItem[]
  maxQuantity: number
  quantityInPackage: (item: CatalogItem) => number
  addFromCatalog: (item: CatalogItem, quantity: number) => void
}

/**
 * The "Add items" modal: search the saved items, choose how many of each, add. Available items
 * come first; unavailable ones are listed but can't be added. The chosen quantity resets to 1
 * after each add, so adding again tops the package line up. Used inside the modal's content,
 * which mounts on open, so every opening starts fresh.
 */
export function useItemPicker({ items, maxQuantity, quantityInPackage, addFromCatalog }: ItemPickerOptions) {
  const [search, setSearch] = useState('')
  const [quantities, setQuantities] = useState<Record<number, number>>({})

  const term = search.trim().toLowerCase()
  const visible = useMemo(() => items
    .filter(item => !term || item.name.toLowerCase().includes(term) || (item.sku ?? '').toLowerCase().includes(term))
    .sort((a, b) => Number(b.inStock) - Number(a.inStock)), [items, term])

  return {
    search,
    setSearch,
    visible,
    isFiltered: Boolean(term),
    quantityFor: (item: CatalogItem) => quantities[item.id] ?? 1,
    setQuantityFor: (item: CatalogItem, value: number) => setQuantities(current => ({ ...current, [item.id]: value })),
    inPackage: quantityInPackage,
    /** Room left before the package line hits the maximum. */
    roomFor: (item: CatalogItem) => Math.max(maxQuantity - quantityInPackage(item), 0),
    add: (item: CatalogItem) => {
      if (!item.inStock) return
      const quantity = Math.min(quantities[item.id] ?? 1, Math.max(maxQuantity - quantityInPackage(item), 0))
      if (quantity < 1) return
      const already = quantityInPackage(item) > 0
      addFromCatalog(item, quantity)
      setQuantities(current => ({ ...current, [item.id]: 1 }))
      toast.success(already ? `${item.name}: ${quantityInPackage(item) + quantity} in the package` : `${quantity} × ${item.name} added`, { id: `picked-${item.id}` })
    },
  }
}
