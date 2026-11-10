import type { ComponentProps } from 'react'
import type { CatalogItem } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { ItemCard } from './ItemCard'

type CardActions = Omit<ComponentProps<typeof ItemCard>, 'item'>
type ItemListProps = CardActions & { items: CatalogItem[]; isFiltered: boolean; onAdd: () => void }

export function ItemList({ items, isFiltered, onAdd, ...actions }: ItemListProps) {
  if (items.length === 0) return <div className="mt-5 flex flex-col items-center rounded-2xl border border-dashed border-[#C9D8CF] bg-[#FAFCFA] p-8 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF5E9] text-[#438352]"><Icon name="box" size={22}/></div>
    <div className="mt-3 text-sm font-extrabold text-[#17382C]">{isFiltered ? 'No items match' : 'No items yet'}</div>
    <div className="mt-1 max-w-xs text-xs leading-5 text-[#7D8E85]">{isFiltered ? 'Try another search or filter.' : 'Add what you sell. Items need no stock tracking and work in shipping rates and checkout.'}</div>
    {!isFiltered && <Button variant="outline" icon="plus" onClick={onAdd} className="mt-4">Add your first item</Button>}
  </div>
  return <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
    {items.map(item => <ItemCard key={item.id} item={item} {...actions}/>)}
  </div>
}
