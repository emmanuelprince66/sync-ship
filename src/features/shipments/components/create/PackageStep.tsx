import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { MediaCardGridSkeleton } from '@/components/ui/Skeleton'
import type { CreateShipmentWizard } from '../../hooks/useCreateShipmentWizard'

function EmptyProduct({ onAdd }: { onAdd: () => void }) {
  return <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#C9D8CF] bg-[#FAFCFA] p-8 text-center">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF5E9] text-[#438352]"><Icon name="box" size={26}/></div>
    <div className="mt-4 text-sm font-extrabold text-[#17382C]">No items added yet</div>
    <div className="mt-1.5 max-w-xs text-xs leading-5 text-[#7D8E85]">Add the items you want to ship. You don’t need a product catalogue or inventory.</div>
    <Button variant="outline" icon="plus" onClick={onAdd} className="mt-5">Add your first item</Button>
  </div>
}

function ProductForm({ index, wizard }: { index: number; wizard: CreateShipmentWizard }) {
  const { register, errors, removeProduct } = wizard
  const fieldErrors = errors.products?.[index]
  return <div className="rounded-2xl border border-[#DDE7E1] bg-white p-5">
    <div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEF6ED] text-[#438352]"><Icon name="box" size={18}/></div><div><div className="text-sm font-extrabold text-[#17382C]">Package item</div><div className="text-[10px] text-[#899890]">Enter the item’s details</div></div></div><button type="button" aria-label="Remove item" onClick={() => removeProduct(index)} className="rounded-lg p-2 text-[#A0ADA6] hover:bg-[#FFF0EE] hover:text-[#D15B50]"><Icon name="trash" size={17}/></button></div>
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Product name" placeholder="e.g. Handmade leather bag" error={fieldErrors?.name?.message} {...register(`products.${index}.name`)}/>
      <div className="grid grid-cols-2 gap-3"><Field label="Quantity" type="number" min={1} {...register(`products.${index}.quantity`)}/><Field label="Item value" type="number" min={0} placeholder="0.00" suffix="NGN" {...register(`products.${index}.amount`)}/></div>
      <Field label="Package weight" type="number" min={0} step="0.1" placeholder="0.0" suffix="kg" hint="Use the combined package weight" error={fieldErrors?.weight?.message} {...register(`products.${index}.weight`)}/>
      <div className="grid grid-cols-2 gap-3"><Field label="Length" placeholder="0" suffix="cm" inputMode="decimal" {...register(`products.${index}.length`)}/><Field label="Width" placeholder="0" suffix="cm" inputMode="decimal" {...register(`products.${index}.width`)}/></div>
    </div>
  </div>
}

export function PackageStep({ wizard }: { wizard: CreateShipmentWizard }) {
  const { fields, catalog, catalogLoading, showCatalogNote, addProduct, addFromCatalog } = wizard
  return <div>
    <div className="mb-6 flex items-end justify-between"><div><div className="text-lg font-black text-[#0F3124]">What are you sending?</div><div className="mt-1 text-xs text-[#7E8E86]">Add the item and package dimensions for an accurate delivery rate.</div></div>{fields.length > 0 && <Button variant="outline" icon="plus" onClick={addProduct} className="hidden sm:flex">Add item</Button>}</div>
    {(catalogLoading || catalog.length > 0) && <div className="mb-6"><div className="mb-3 flex items-center justify-between gap-3"><div className="text-xs font-extrabold text-[#28483B]">Select from your item list</div><div className="text-[10px] text-[#899890]">Saved items fill automatically</div></div>{catalogLoading ? <MediaCardGridSkeleton count={3} className="grid grid-cols-2 gap-3 sm:grid-cols-3" imageClassName="h-24"/> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{catalog.map(item => <button type="button" key={item.id} onClick={() => addFromCatalog(item)} className="group overflow-hidden rounded-2xl border border-[#DFE8E2] bg-white text-left transition hover:border-[#529661] hover:shadow-[0_8px_24px_rgba(19,63,43,.08)]"><img src={item.image} alt={item.name} className="h-24 w-full object-cover"/><div className="p-3"><div className="truncate text-[11px] font-extrabold text-[#28483B]">{item.name}</div><div className="mt-1 flex items-center justify-between text-[9px] text-[#87968F]"><span>{item.weight} kg</span><span className="font-extrabold text-[#438352]">+ Add</span></div></div></button>)}</div>}</div>}
    {showCatalogNote && <div role="note" className="mb-4 flex items-start gap-2 rounded-xl bg-[#FFF8E8] p-3 text-[11px] leading-5 text-[#80662B]"><Icon name="clock" size={16}/><span>Orders can only be created for products saved in your item list. Remove items you typed in and pick them from the list above.</span></div>}
    <div className="space-y-4">{fields.length === 0 ? <EmptyProduct onAdd={addProduct}/> : fields.map((field, index) => <ProductForm key={field.id} index={index} wizard={wizard}/>)}</div>
    {fields.length > 0 && <Button variant="ghost" icon="plus" onClick={addProduct} className="mt-4 w-full border border-dashed border-[#C9D8CF]">Add another item</Button>}
  </div>
}
