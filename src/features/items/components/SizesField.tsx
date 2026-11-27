import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import type { useItemForm } from '../hooks/useItemForm'

type Sizes = ReturnType<typeof useItemForm>['sizes']

/**
 * Sizes customers pick from on the storefront (Mr Sunde, 27 Nov): type a size, add it, and give it its own price
 * only when it costs differently. Saved as the item's `variations`.
 */
export function SizesField({ sizes }: { sizes: Sizes }) {
  const [draft, setDraft] = useState('')
  const add = () => { sizes.add(draft); setDraft('') }

  return <div>
    <div className="mb-1.5 flex items-baseline justify-between gap-3">
      <span className="text-xs font-extrabold text-[#304B40]">Sizes (optional)</span>
      <span className="text-[10px] text-[#8A9891]">Customers pick one on your storefront</span>
    </div>
    {/* Not a nested <form>: Enter adds the size without saving the item. */}
    <div className="flex gap-2">
      <input
        value={draft}
        onChange={event => setDraft(event.target.value)}
        onKeyDown={event => { if (event.key === 'Enter' || event.key === ',') { event.preventDefault(); add() } }}
        placeholder="e.g. Small, Medium, Large or 42"
        aria-label="New size"
        maxLength={60}
        className="h-11 min-w-0 flex-1 rounded-xl border border-[#DFE7E2] bg-white px-3 text-sm font-semibold text-[#09261C] outline-none placeholder:font-medium placeholder:text-[#9AA8A1] focus:border-[#529661]"
      />
      <button type="button" onClick={add} disabled={!draft.trim()} className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-[#DFE7E2] px-3.5 text-xs font-extrabold text-[#2F6B45] hover:bg-[#F3F7F4] disabled:opacity-45"><Icon name="plus" size={15}/>Add</button>
    </div>
    {sizes.rows.length > 0 && <ul className="mt-2.5 flex flex-col gap-2">
      {sizes.rows.map((row, index) => <li key={row.id} className="flex items-center gap-2 rounded-xl border border-[#E2E9E5] bg-[#FAFCFA] p-2 pl-3">
        <input aria-label={`Size ${index + 1}`} {...sizes.register(index, 'name')} className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[#09261C] outline-none"/>
        <label className="flex h-9 w-[132px] shrink-0 items-center gap-1 rounded-lg border border-[#DFE7E2] bg-white px-2 text-[11px] text-[#7C8D85]">
          <span>₦</span>
          <input type="number" min="0" step="any" inputMode="decimal" aria-label={`Price for size ${index + 1}`} placeholder="Same price" {...sizes.register(index, 'price')} className="w-full min-w-0 bg-transparent text-xs font-semibold text-[#09261C] outline-none placeholder:text-[#9AA8A1]"/>
        </label>
        <button type="button" aria-label={`Remove size ${index + 1}`} onClick={() => sizes.remove(index)} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[#91A098] hover:bg-[#FFF0EE] hover:text-[#C2483D]"><Icon name="close" size={15}/></button>
      </li>)}
    </ul>}
    {sizes.rows.map((_, index) => sizes.error(index)).find(Boolean) && <p role="alert" className="mt-1.5 text-[11px] font-semibold text-[#C2483D]">{sizes.rows.map((_, index) => sizes.error(index)).find(Boolean)}</p>}
  </div>
}
