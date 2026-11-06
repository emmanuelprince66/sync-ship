import type { CatalogItem } from '@/api/types'
import { ItemCard } from './ItemCard'

type ItemListProps = {
  items: CatalogItem[]
  onToggleStock: (item: CatalogItem) => void
  onEditPrice: (item: CatalogItem) => void
}

export function ItemList({ items, onToggleStock, onEditPrice }: ItemListProps) {
  if (items.length === 0) return <div className="mt-5 rounded-2xl border border-dashed border-[#C9D8CF] bg-[#FAFCFA] p-8 text-center text-xs text-[#7D8E85]">No items match your search.</div>
  return <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
    {items.map(item => <ItemCard key={item.id} item={item} onToggleStock={onToggleStock} onEditPrice={onEditPrice}/>)}
  </div>
}
