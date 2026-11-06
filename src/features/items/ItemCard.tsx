import type { CatalogItem } from '@/api/types'
import { Icon } from '@/components/ui/Icon'
import { Toggle } from '@/components/ui/Toggle'
import { cn } from '@/lib/cn'
import { formatNaira } from '@/lib/format'

type ItemCardProps = {
  item: CatalogItem
  onToggleStock: (item: CatalogItem) => void
  onEditPrice: (item: CatalogItem) => void
}

export function ItemCard({ item, onToggleStock, onEditPrice }: ItemCardProps) {
  return <div className="overflow-hidden rounded-2xl border border-[#E0E8E3] bg-white">
    <div className="relative">
      <img src={item.image} alt={item.name} className={cn('h-40 w-full object-cover', !item.inStock && 'grayscale opacity-65')}/>
      <span className={cn('absolute left-3 top-3 rounded-full px-2.5 py-1 text-[9px] font-extrabold shadow-sm', item.inStock ? 'bg-white text-[#438352]' : 'bg-[#3B4641] text-white')}>{item.inStock ? 'In stock' : 'Out of stock'}</span>
      <button type="button" aria-label={`More options for ${item.name}`} className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-[#5F7168] shadow-sm"><Icon name="more" size={15}/></button>
    </div>
    <div className="p-4">
      <div className="truncate text-xs font-extrabold text-[#28483B]">{item.name}</div>
      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-[10px] font-semibold text-[#829189]">{item.weight} kg</span>
        <button type="button" onClick={() => onEditPrice(item)} className="flex items-center gap-1 text-xs font-black text-[#17382C] hover:text-[#438352]">{formatNaira(item.price)} <span className="text-[9px]">Edit</span></button>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-[#EDF1EF] pt-3">
        <span className="text-[10px] font-bold text-[#718279]">Availability</span>
        <Toggle enabled={item.inStock} onChange={() => onToggleStock(item)} label={`${item.name} availability`}/>
      </div>
    </div>
  </div>
}
