import { ItemImage } from '@/components/ui/ItemImage'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { MediaCardGridSkeleton } from '@/components/ui/Skeleton'
import { formatNaira } from '@/lib/format'
import type { CreateShipmentWizard } from '../../hooks/useCreateShipmentWizard'
import { PackageItemPanel } from './PackageItemPanel'

function EmptyProduct({ onAdd }: { onAdd: () => void }) {
  return <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#C9D8CF] bg-[#FAFCFA] p-8 text-center">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF5E9] text-[#438352]"><Icon name="box" size={26}/></div>
    <div className="mt-4 text-sm font-extrabold text-[#17382C]">No items added yet</div>
    <div className="mt-1.5 max-w-xs text-xs leading-5 text-[#7D8E85]">Add the items you want to ship. You don’t need a product catalogue or inventory.</div>
    <Button variant="outline" icon="plus" onClick={onAdd} className="mt-5">Add your first item</Button>
  </div>
}

/** One added item as a compact row; details are edited in the side panel. */
function ItemRow({ index, wizard }: { index: number; wizard: CreateShipmentWizard }) {
  const item = wizard.products[index]
  const invalid = Boolean(wizard.errors.products?.[index])
  if (!item) return null
  return <div className={`flex items-center gap-3 rounded-2xl border bg-white p-3.5 sm:p-4 ${invalid ? 'border-[#E8B4AE]' : 'border-[#DDE7E1]'}`}>
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF6ED] text-[#438352]"><Icon name="box" size={18}/></div>
    <button type="button" onClick={() => wizard.editProduct(index)} className="min-w-0 flex-1 text-left">
      <div className="truncate text-sm font-extrabold text-[#17382C]">{item.name || 'Untitled item'}</div>
      <div className="mt-0.5 truncate text-[11px] text-[#899890]">{item.quantity || 1} × {item.amount ? formatNaira(item.amount) : 'no value'} · {item.weight ? `${item.weight} kg` : <span className="font-bold text-[#C2483D]">add weight</span>}</div>
    </button>
    <button type="button" aria-label={`Edit ${item.name || 'item'}`} onClick={() => wizard.editProduct(index)} className="rounded-lg px-2.5 py-1.5 text-[11px] font-extrabold text-[#438352] hover:bg-[#EAF5E9]">Edit</button>
    <button type="button" aria-label={`Remove ${item.name || 'item'}`} onClick={() => wizard.removeProduct(index)} className="rounded-lg p-2 text-[#A0ADA6] hover:bg-[#FFF0EE] hover:text-[#D15B50]"><Icon name="trash" size={17}/></button>
  </div>
}

export function PackageStep({ wizard }: { wizard: CreateShipmentWizard }) {
  const { fields, catalog, catalogLoading, addProduct, addFromCatalog, itemPanel } = wizard
  return <div>
    <div className="mb-6 flex items-end justify-between gap-3"><div><div className="text-lg font-black text-[#0F3124]">What are you sending?</div><div className="mt-1 text-xs text-[#7E8E86]">Add the items and their package weight for an accurate delivery rate.</div></div>{fields.length > 0 && <Button variant="outline" icon="plus" onClick={addProduct} className="hidden shrink-0 sm:flex">Add item</Button>}</div>
    {(catalogLoading || catalog.length > 0) && <div className="mb-6"><div className="mb-3 flex items-center justify-between gap-3"><div className="text-xs font-extrabold text-[#28483B]">Select from your item list</div><div className="text-[10px] text-[#899890]">Saved items fill automatically</div></div>{catalogLoading ? <MediaCardGridSkeleton count={3} className="grid grid-cols-2 gap-3 sm:grid-cols-3" imageClassName="h-24"/> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{catalog.map(item => <button type="button" key={item.id} onClick={() => addFromCatalog(item)} className="group overflow-hidden rounded-2xl border border-[#DFE8E2] bg-white text-left transition hover:border-[#529661] hover:shadow-[0_8px_24px_rgba(19,63,43,.08)]"><ItemImage src={item.image} alt={item.name} className="h-24 w-full" iconSize={22}/><div className="p-3"><div className="truncate text-[11px] font-extrabold text-[#28483B]">{item.name}</div><div className="mt-1 flex items-center justify-between text-[9px] text-[#87968F]"><span>{item.weight} kg</span><span className="font-extrabold text-[#438352]">+ Add</span></div></div></button>)}</div>}</div>}
    {fields.length === 0
      ? <EmptyProduct onAdd={addProduct}/>
      : <>
        <div className="mb-2 text-xs font-extrabold text-[#28483B]">Items in this package ({fields.length})</div>
        <div className="flex flex-col gap-2.5">{fields.map((field, index) => <ItemRow key={field.id} index={index} wizard={wizard}/>)}</div>
        <Button variant="ghost" icon="plus" onClick={addProduct} className="mt-3 w-full border border-dashed border-[#C9D8CF]">Add another item</Button>
      </>}
    <PackageItemPanel open={itemPanel.open} isEdit={itemPanel.isEdit} initial={itemPanel.initial} onClose={itemPanel.close} onSave={itemPanel.save}/>
  </div>
}
