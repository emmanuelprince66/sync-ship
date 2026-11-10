import type { CatalogItem } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { FilePicker } from '@/components/ui/common'
import { Field } from '@/components/ui/Field'
import { ItemImage } from '@/components/ui/ItemImage'
import { Modal, ModalHeader } from '@/components/ui/Modal'
import { Toggle } from '@/components/ui/Toggle'
import { useItemForm } from './hooks/useItemForm'

function SwitchRow({ title, detail, enabled, onChange }: { title: string; detail: string; enabled: boolean; onChange: (value: boolean) => void }) {
  return <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#E2E9E5] p-3.5">
    <div className="min-w-0"><div className="text-xs font-extrabold text-[#304B40]">{title}</div><div className="mt-0.5 text-[10px] leading-4 text-[#8A9891]">{detail}</div></div>
    <Toggle enabled={enabled} onChange={onChange} label={title}/>
  </div>
}

/** Create or edit an item. On phones it fills the screen with a fixed save bar. */
export function ItemFormModal({ open, item, onClose }: { open: boolean; item: CatalogItem | null; onClose: () => void }) {
  const form = useItemForm({ open, item, onClose })

  return <Modal open={open} onClose={onClose} overlayClassName="bg-[#09261C]/40 p-0 backdrop-blur-[2px] sm:p-4" panelClassName="flex h-[100dvh] w-full flex-col bg-white shadow-[0_25px_80px_rgba(9,38,28,.2)] sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:max-w-lg sm:rounded-3xl">
    <ModalHeader title={form.isEdit ? 'Edit item' : 'Add an item'} description={form.isEdit ? 'Changes apply to new shipments and your storefront.' : 'Save it to your item list and storefront.'} onClose={onClose} className="shrink-0 border-b border-[#EDF1EF] px-5 py-4 sm:px-6"/>
    <form onSubmit={form.onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4">
          <Field label="Item name" placeholder="e.g. Branded tote bag" error={form.errors.name?.message} {...form.register('name')}/>
          <label className="block">
            <span className="mb-2 block text-[12px] font-extrabold text-[#34483F]">Description <span className="font-semibold text-[#9AABA3]">(optional)</span></span>
            <textarea rows={3} placeholder="What customers should know about it" className="w-full resize-none rounded-xl border border-[#DCE7E0] bg-white px-3.5 py-3 text-sm font-semibold text-[#09261C] outline-none transition placeholder:font-medium placeholder:text-[#9AABA3] focus:border-[#529661] focus:ring-4 focus:ring-[#529661]/10" {...form.register('description')}/>
          </label>
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
            <Field label="Selling price" type="number" placeholder="0.00" suffix="NGN" step="any" min="0" error={form.errors.price?.message} {...form.register('price')}/>
            <Field label="Weight" type="number" placeholder="0.0" suffix="kg" step="any" min="0" error={form.errors.weight?.message} {...form.register('weight')}/>
          </div>
          <p className="-mt-2 text-[11px] leading-4 text-[#7C8D85]">Weight is used to calculate delivery rates. Left blank, your default package weight is used.</p>
          <FilePicker accept="image/*" onFile={form.pickImage} className="block">
            <span className="mb-2 block text-[12px] font-extrabold text-[#34483F]">Item picture <span className="font-semibold text-[#9AABA3]">(optional)</span></span>
            <span className="flex items-center gap-4 rounded-2xl border border-dashed border-[#C9D8CF] bg-[#FAFCFA] p-3.5 transition hover:border-[#529661]">
              <ItemImage src={form.image} alt="Item preview" className="h-14 w-14 shrink-0 rounded-xl" iconSize={20}/>
              <span className="min-w-0"><span className="block text-xs font-extrabold text-[#28483B]">{form.image ? 'Change picture' : 'Upload a picture'}</span><span className="mt-1 block text-[10px] text-[#87968F]">JPG, PNG or WebP · up to 5 MB</span></span>
            </span>
          </FilePicker>
          <div className="flex flex-col gap-2.5">
            <SwitchRow title="Available" detail="Can be added to shipments and ordered." enabled={form.available} onChange={form.setAvailable}/>
            <SwitchRow title="Listed on storefront" detail="Shows on your public store when it serves these items." enabled={form.listed} onChange={form.setListed}/>
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
