import type { CatalogItem } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Modal, ModalHeader } from '@/components/ui/Modal'
import { TextAreaField } from '@/components/ui/TextAreaField'
import { Toggle } from '@/components/ui/Toggle'
import { ItemGalleryField } from './components/ItemGalleryField'
import { SkuLookupField } from './components/SkuLookupField'
import { useItemForm } from './hooks/useItemForm'

function SwitchRow({ title, detail, enabled, onChange }: { title: string; detail: string; enabled: boolean; onChange: (value: boolean) => void }) {
  return <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#E2E9E5] p-3.5">
    <div className="min-w-0"><div className="text-xs font-extrabold text-[#304B40]">{title}</div><div className="mt-0.5 text-[10px] leading-4 text-[#8A9891]">{detail}</div></div>
    <Toggle enabled={enabled} onChange={onChange} label={title}/>
  </div>
}

type ItemFormModalProps = {
  open: boolean
  item: CatalogItem | null
  onClose: () => void
  /** Called with the saved item before the modal closes. */
  onSaved?: (item: CatalogItem) => void
  /** Overrides the "Add an item" description (e.g. "It's added to this package too"). */
  addDescription?: string
}

/** Create or edit an item. On phones it fills the screen with a fixed save bar. */
export function ItemFormModal({ open, item, onClose, onSaved, addDescription }: ItemFormModalProps) {
  const form = useItemForm({ open, item, onClose, onSaved })

  return <Modal open={open} onClose={onClose} overlayClassName="bg-[#09261C]/40 p-0 backdrop-blur-[2px] sm:p-4" panelClassName="flex h-[100dvh] w-full flex-col bg-white shadow-[0_25px_80px_rgba(9,38,28,.2)] sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:max-w-xl sm:rounded-3xl">
    <ModalHeader title={form.isEdit ? 'Edit item' : 'Add an item'} description={form.isEdit ? 'Changes apply to new shipments and your storefront.' : addDescription ?? 'Save it to your item list and storefront.'} onClose={onClose} className="shrink-0 border-b border-[#EDF1EF] px-5 py-4 sm:px-6"/>
    {/* Stops the submit here: the modal can sit inside another form (the shipment wizard) through its portal. */}
    <form onSubmit={event => { event.stopPropagation(); void form.onSubmit(event) }} noValidate className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4">
          {!form.isEdit && <SkuLookupField sku={form.sku}/>}
          <Field label="Item name" placeholder="e.g. Branded tote bag" error={form.errors.name?.message} {...form.register('name')}/>
          <TextAreaField label="Description (optional)" rows={3} placeholder="What customers should know about it" {...form.register('description')}/>
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
            <Field label="Selling price" type="number" placeholder="0.00" suffix="NGN" step="any" min="0" error={form.errors.price?.message} {...form.register('price')}/>
            <Field label="Weight" type="number" placeholder="0.0" suffix="kg" step="any" min="0" error={form.errors.weight?.message} {...form.register('weight')}/>
          </div>
          <p className="-mt-2 text-[11px] leading-4 text-[#7C8D85]">{form.usesDefaultWeight ? <><strong className="font-extrabold text-[#4D7656]">Uses your default package weight</strong> for delivery rates. Add a weight for a more accurate rate.</> : 'Weight is used to calculate delivery rates.'}</p>
          <Field label="SKU (optional)" placeholder="Your SKU or the barcode number" autoComplete="off" error={form.errors.sku?.message} {...form.register('sku')}/>
          <ItemGalleryField gallery={form.gallery}/>
          <div className="flex flex-col gap-2.5">
            <SwitchRow title="Available" detail="Can be added to shipments and ordered." enabled={form.available} onChange={form.setAvailable}/>
            <SwitchRow title="Sell online" detail="Listed on your storefront, so customers can buy it there." enabled={form.listed} onChange={form.setListed}/>
          </div>
        </div>
      </div>
      <div className="flex shrink-0 justify-end gap-2 border-t border-[#EDF1EF] px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 [&>button]:flex-1 sm:[&>button]:flex-none">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={form.isSaving}>{form.isEdit ? 'Save changes' : 'Save item'}</Button>
      </div>
    </form>
  </Modal>
}
