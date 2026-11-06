import type { CatalogItem } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { formatNaira } from '@/lib/format'

type ProductCardProps = { item: CatalogItem; quantity: number; onAdd: () => void; onRemove: () => void }

export function ProductCard({ item, quantity, onAdd, onRemove }: ProductCardProps) {
  return <div className="group overflow-hidden rounded-3xl border border-[#E0E8E3] bg-white transition hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(17,49,37,.09)]">
    <div className="overflow-hidden"><img src={item.image} alt={item.name} className="h-64 w-full object-cover transition duration-500 group-hover:scale-105"/></div>
    <div className="p-5">
      <div className="text-sm font-extrabold text-[#28483B]">{item.name}</div>
      <div className="mt-1 text-[10px] text-[#87968F]">{item.weight} kg · Ready to ship</div>
      <div className="mt-5 flex items-center justify-between">
        <span className="text-base font-black text-[#17382C]">{formatNaira(item.price)}</span>
        {quantity
          ? <div className="flex items-center gap-3 rounded-xl bg-[#EEF6ED] px-2 py-1.5"><button type="button" aria-label={`Remove one ${item.name}`} onClick={onRemove} className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-sm font-black text-[#438352]">−</button><span className="text-xs font-black text-[#28483B]" aria-live="polite">{quantity}</span><button type="button" aria-label={`Add one ${item.name}`} onClick={onAdd} className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#529661] text-white"><Icon name="plus" size={13}/></button></div>
          : <Button onClick={onAdd} icon="plus" className="py-2">Add to cart</Button>}
      </div>
    </div>
  </div>
}
