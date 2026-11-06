import { useState } from 'react'
import type { CatalogItem } from '@/api/types'

export type CartLine = { item: CatalogItem; quantity: number; total: number }

/** Cart keyed by item id. Only in-stock `items` count toward totals. */
export function useCart(items: CatalogItem[]) {
  const [cart, setCart] = useState<Record<number, number>>({})

  const add = (id: number) => setCart(current => ({ ...current, [id]: (current[id] || 0) + 1 }))
  const remove = (id: number) => setCart(current => ({ ...current, [id]: Math.max(0, (current[id] || 0) - 1) }))
  const clear = () => setCart({})

  const lines: CartLine[] = items
    .filter(item => cart[item.id])
    .map(item => ({ item, quantity: cart[item.id], total: Number(item.price) * cart[item.id] }))

  return {
    quantityOf: (id: number) => cart[id] || 0,
    add,
    remove,
    clear,
    lines,
    count: lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotal: lines.reduce((sum, line) => sum + line.total, 0),
  }
}
