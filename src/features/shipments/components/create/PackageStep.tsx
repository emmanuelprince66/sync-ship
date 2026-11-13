import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { ItemImage } from '@/components/ui/ItemImage'
import { QuantityStepper } from '@/components/ui/QuantityStepper'
import { MediaCardGridSkeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { formatNaira } from '@/lib/format'
import { ItemFormModal } from '@/features/items/ItemFormModal'
import type { CreateShipmentWizard } from '../../hooks/useCreateShipmentWizard'
import { AddItemsModal } from './AddItemsModal'
import { PackageLineEditor } from './PackageLineEditor'

function EmptyProduct({ onAdd }: { onAdd: () => void }) {
  return <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#C9D8CF] bg-[#FAFCFA] p-8 text-center">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF5E9] text-[#438352]"><Icon name="box" size={26}/></div>
    <div className="mt-4 text-sm font-extrabold text-[#17382C]">No items added yet</div>
    <div className="mt-1.5 max-w-xs text-xs leading-5 text-[#7D8E85]">Add the items you want to ship from your item list.</div>
    <Button variant="outline" icon="plus" onClick={onAdd} className="mt-5">Add your first item</Button>
  </div>
}

const weightText = (weight: string) => (Number(weight) > 0 ? `${weight} kg each` : 'Uses your default package weight')

/** One package line: picture, name, price and weight, a − qty + counter, and the line total. */
function ItemRow({ index, wizard }: { index: number; wizard: CreateShipmentWizard }) {
  const item = wizard.products[index]
  const invalid = Boolean(wizard.errors.products?.[index])
  if (!item) return null
  const quantity = Number(item.quantity) || 1
  const name = item.name || 'Untitled item'
  return <div className={cn('rounded-2xl border bg-white p-3 sm:p-3.5', invalid ? 'border-[#E8B4AE]' : 'border-[#DDE7E1]')}>
    <div className="flex items-center gap-3">
      <ItemImage src={wizard.lineImage(index)} alt={name} className="h-12 w-12 shrink-0 rounded-xl" iconSize={18}/>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-extrabold text-[#17382C]">{name}</div>
        <div className="mt-0.5 flex flex-wrap gap-x-1.5 text-[11px] leading-4 text-[#899890]"><span>{item.amount ? formatNaira(item.amount) : 'No value'}</span><span aria-hidden="true" className="hidden sm:inline">·</span><span className={cn('basis-full sm:basis-auto', !(Number(item.weight) > 0) && 'font-semibold text-[#5E7F66]')}>{weightText(item.weight)}</span></div>
      </div>
      <div className="hidden sm:block"><QuantityStepper value={quantity} onChange={value => wizard.setQuantity(index, value)} max={wizard.maxQuantity} label={`Quantity of ${name}`}/></div>
      <div className="hidden w-24 shrink-0 text-right text-sm font-black text-[#17382C] sm:block">{formatNaira((Number(item.amount) || 0) * quantity)}</div>
      {wizard.canEditLines && <button type="button" aria-label={`Edit ${name}`} onClick={() => wizard.editProduct(index)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#5F7168] hover:bg-[#EAF5E9] hover:text-[#438352]"><Icon name="edit" size={17}/></button>}
      <button type="button" aria-label={`Remove ${name}`} onClick={() => wizard.removeProduct(index)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#A0ADA6] hover:bg-[#FFF0EE] hover:text-[#D15B50]"><Icon name="trash" size={17}/></button>
    </div>
    {/* Phones: the counter gets its own row with big tap targets. */}
    <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#EEF2EF] pt-3 sm:hidden">
      <QuantityStepper value={quantity} onChange={value => wizard.setQuantity(index, value)} max={wizard.maxQuantity} label={`Quantity of ${name}`}/>
      <div className="text-right"><div className="text-[10px] text-[#899890]">Total</div><div className="text-sm font-black text-[#17382C]">{formatNaira((Number(item.amount) || 0) * quantity)}</div></div>
    </div>
  </div>
}

/** Live totals for the package: units, known weight (plus lines on the default weight) and value. */
function PackageSummary({ wizard }: { wizard: CreateShipmentWizard }) {
  const { units, weight, defaultWeightLines, value } = wizard.packageSummary
  const weightLabel = weight > 0
    ? `${Number(weight.toFixed(2))} kg${defaultWeightLines ? ` + default weight for ${defaultWeightLines} item${defaultWeightLines === 1 ? '' : 's'}` : ''}`
    : 'Uses your default package weight'
  return <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl bg-[#F3F7F4] p-3 text-center sm:p-4" aria-live="polite">
    <div><div className="text-[10px] font-bold text-[#7D8E85]">Items</div><div className="mt-0.5 text-sm font-black text-[#17382C]">{units}</div></div>
    <div className="min-w-0"><div className="text-[10px] font-bold text-[#7D8E85]">Weight</div><div className="mt-0.5 text-[11px] font-black leading-4 text-[#17382C] sm:text-sm">{weightLabel}</div></div>
    <div><div className="text-[10px] font-bold text-[#7D8E85]">Value</div><div className="mt-0.5 text-sm font-black text-[#17382C]">{formatNaira(value)}</div></div>
  </div>
}

export function PackageStep({ wizard }: { wizard: CreateShipmentWizard }) {
  const { fields, catalog, catalogLoading, addProduct, addFromCatalog, quantityInPackage, lineEditor, newItemForm } = wizard
  return <div>
    <div className="mb-6 flex items-end justify-between gap-3"><div><div className="text-lg font-black text-[#0F3124]">What are you sending?</div><div className="mt-1 text-xs text-[#7E8E86]">Add the items and how many of each for an accurate delivery rate.</div></div>{fields.length > 0 && <Button variant="outline" icon="plus" onClick={addProduct} className="hidden shrink-0 sm:flex">Add item</Button>}</div>
    {(catalogLoading || catalog.length > 0) && <div className="mb-6">
      <div className="mb-3 flex items-center justify-between gap-3"><div className="text-xs font-extrabold text-[#28483B]">Select from your item list</div><button type="button" onClick={addProduct} className="text-[11px] font-extrabold text-[#438352]">Search all</button></div>
      {catalogLoading
        ? <MediaCardGridSkeleton count={3} className="grid grid-cols-2 gap-3 sm:grid-cols-3" imageClassName="h-24"/>
        : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{catalog.slice(0, 6).map(item => {
          const inPackage = quantityInPackage(item)
          return <button type="button" key={item.id} onClick={() => addFromCatalog(item)} aria-label={`Add ${item.name}${inPackage ? ` (${inPackage} in package)` : ''}`} className={cn('group relative overflow-hidden rounded-2xl border bg-white text-left transition hover:border-[#529661] hover:shadow-[0_8px_24px_rgba(19,63,43,.08)]', inPackage ? 'border-[#529661]' : 'border-[#DFE8E2]')}>
            <ItemImage src={item.image} alt={item.name} className="h-24 w-full" iconSize={22}/>
            {inPackage > 0 && <span className="absolute right-2 top-2 rounded-full bg-[#09261C] px-2 py-0.5 text-[10px] font-extrabold text-white">× {inPackage}</span>}
            <div className="p-3"><div className="truncate text-[11px] font-extrabold text-[#28483B]">{item.name}</div><div className="mt-1 flex items-center justify-between text-[9px] text-[#87968F]"><span>{Number(item.weight) > 0 ? `${item.weight} kg` : 'Default weight'}</span><span className="font-extrabold text-[#438352]">{inPackage ? '+ 1 more' : '+ Add'}</span></div></div>
          </button>
        })}</div>}
    </div>}
    {fields.length === 0
      ? <EmptyProduct onAdd={addProduct}/>
      : <>
        <div className="mb-2 text-xs font-extrabold text-[#28483B]">Items in this package ({fields.length})</div>
        <div className="flex flex-col gap-2.5">{fields.map((field, index) => <ItemRow key={field.id} index={index} wizard={wizard}/>)}</div>
        <PackageSummary wizard={wizard}/>
        <Button variant="ghost" icon="plus" onClick={addProduct} className="mt-3 h-12 w-full border border-dashed border-[#C9D8CF]">Add another item</Button>
      </>}
    <AddItemsModal wizard={wizard}/>
    {wizard.canEditLines && <PackageLineEditor open={lineEditor.open} initial={lineEditor.initial} maxQuantity={wizard.maxQuantity} onClose={lineEditor.close} onSave={lineEditor.save}/>}
    {wizard.canCreateItems && <ItemFormModal open={newItemForm.isOpen} item={null} onClose={newItemForm.close} onSaved={wizard.addCreatedItem} addDescription="It’s saved to your item list and added to this package."/>}
  </div>
}
