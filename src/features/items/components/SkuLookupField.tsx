import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import type { useSkuPrefill } from '../hooks/useSkuPrefill'

type SkuPrefill = ReturnType<typeof useSkuPrefill>

/** "name, description and price" */
const listText = (parts: string[]) => (parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}` : parts.join(''))

/** "Load from SKU / barcode": type or paste a code, press Load, and the form fills in. */
export function SkuLookupField({ sku }: { sku: SkuPrefill }) {
  const { status } = sku
  return <div className="rounded-2xl border border-[#E2E9E5] bg-[#FAFCFA] p-3.5">
    <label htmlFor="item-sku" className="block text-[12px] font-extrabold text-[#34483F]">Load from SKU / barcode <span className="font-semibold text-[#9AABA3]">(optional)</span></label>
    <p className="mt-0.5 text-[11px] leading-4 text-[#7C8D85]">Fills the name, description, price and picture when the product is in the catalogue.</p>
    <div className="mt-2.5 flex gap-2">
      <input id="item-sku" value={sku.sku} onChange={event => sku.setSku(event.target.value)} onKeyDown={sku.onKeyDown} placeholder="e.g. 6154000056789" autoComplete="off" inputMode="text" className="h-11 min-w-0 flex-1 rounded-xl border border-[#DCE7E0] bg-white px-3.5 text-sm font-semibold text-[#09261C] outline-none transition placeholder:font-medium placeholder:text-[#9AABA3] focus:border-[#529661] focus:ring-4 focus:ring-[#529661]/10"/>
      <Button variant="secondary" icon="search" loading={sku.isLoading} disabled={!sku.sku.trim()} onClick={() => void sku.load()} className="h-11 shrink-0">Load</Button>
    </div>
    <div aria-live="polite">
      {status.kind === 'found' && <p className="mt-2 flex items-start gap-1.5 text-[11px] font-semibold leading-4 text-[#3F7A4D]"><Icon name="check" size={14}/><span>Found <strong>{status.product.name}</strong>. Filled the {listText(status.filled)}{status.product.price ? '' : ' — add your selling price'}. Review before saving.</span></p>}
      {status.kind === 'notFound' && <p className="mt-2 text-[11px] font-semibold leading-4 text-[#80662B]">No product found for “{status.sku}”. Check the code or fill the details in yourself.</p>}
      {status.kind === 'error' && <p role="alert" className="mt-2 text-[11px] font-semibold leading-4 text-[#D15B50]">{status.message}</p>}
    </div>
  </div>
}
