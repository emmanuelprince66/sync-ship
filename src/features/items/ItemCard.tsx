import { useRef } from 'react'
import type { CatalogItem } from '@/api/types'
import { Icon } from '@/components/ui/Icon'
import { ItemImage } from '@/components/ui/ItemImage'
import { Toggle } from '@/components/ui/Toggle'
import { useDisclosure } from '@/hooks/useDisclosure'
import { useDismiss } from '@/hooks/useDismiss'
import { cn } from '@/lib/cn'
import { formatNaira } from '@/lib/format'

type ItemCardProps = {
  item: CatalogItem
  onToggleAvailable: (item: CatalogItem) => void
  onToggleListed: (item: CatalogItem) => void
  onEditPrice: (item: CatalogItem) => void
  onEdit: (item: CatalogItem) => void
  onDelete: (item: CatalogItem) => void
  /** True while that switch's save is in flight. */
  isSaving?: (item: CatalogItem, flag: 'available' | 'listed') => boolean
}

export function ItemCard({ item, onToggleAvailable, onToggleListed, onEditPrice, onEdit, onDelete, isSaving }: ItemCardProps) {
  const menu = useDisclosure()
  const menuRef = useRef<HTMLDivElement>(null)
  useDismiss(menuRef, menu.isOpen, menu.close)
  const listed = item.listed !== false
  return <div className="rounded-2xl border border-[#E0E8E3] bg-white">
    <div className="relative">
      <ItemImage src={item.image} alt={item.name} className={cn('h-40 w-full rounded-t-2xl', !item.inStock && 'grayscale opacity-65')}/>
      <span className={cn('absolute left-3 top-3 rounded-full px-2.5 py-1 text-[9px] font-extrabold shadow-sm', item.inStock ? 'bg-white text-[#438352]' : 'bg-[#3B4641] text-white')}>{item.inStock ? 'Available' : 'Unavailable'}</span>
      <div ref={menuRef} className="absolute right-3 top-3">
        <button type="button" aria-label={`More options for ${item.name}`} aria-haspopup="menu" aria-expanded={menu.isOpen} onClick={menu.toggle} className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-[#5F7168] shadow-sm hover:bg-white"><Icon name="more" size={15}/></button>
        {menu.isOpen && <div role="menu" className="absolute right-0 top-9 z-10 w-36 rounded-xl border border-[#E2EAE5] bg-white p-1 shadow-[0_15px_40px_rgba(9,38,28,.16)]">
          <button type="button" role="menuitem" onClick={() => { menu.close(); onEdit(item) }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-bold text-[#34483F] hover:bg-[#F1F7F2]"><Icon name="settings" size={14}/>Edit item</button>
          <button type="button" role="menuitem" onClick={() => { menu.close(); onDelete(item) }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-bold text-[#C2483D] hover:bg-[#FFF3F1]"><Icon name="trash" size={14}/>Delete</button>
        </div>}
      </div>
    </div>
    <div className="p-4">
      <button type="button" onClick={() => onEdit(item)} className="block w-full truncate text-left text-xs font-extrabold text-[#28483B] hover:text-[#438352]">{item.name}</button>
      {item.description && <p className="mt-1 truncate text-[10px] text-[#899890]">{item.description}</p>}
      {item.sku && <p className="mt-1 truncate text-[10px] font-semibold text-[#7C8D85]">SKU {item.sku}</p>}
      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-[10px] font-semibold text-[#829189]">{Number(item.weight) ? `${item.weight} kg` : 'No weight set'}</span>
        <button type="button" onClick={() => onEditPrice(item)} className="flex items-center gap-1 text-xs font-black text-[#17382C] hover:text-[#438352]">{formatNaira(item.price)} <span className="text-[9px]">Edit</span></button>
      </div>
      <div className="mt-4 flex flex-col gap-2.5 border-t border-[#EDF1EF] pt-3">
        <div className="flex items-center justify-between"><span className="text-[10px] font-bold text-[#718279]">Availability</span><Toggle enabled={item.inStock} onChange={() => onToggleAvailable(item)} loading={isSaving?.(item, 'available')} label={`${item.name} availability`}/></div>
        <div className="flex items-center justify-between"><span className="text-[10px] font-bold text-[#718279]">Sell online</span><Toggle enabled={listed} onChange={() => onToggleListed(item)} loading={isSaving?.(item, 'listed')} label={`${item.name} on storefront`}/></div>
      </div>
    </div>
  </div>
}
