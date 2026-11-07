import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { Drawer, ModalTitle } from '@/components/ui/Modal'
import { usePackageItemForm } from '../../hooks/usePackageItemForm'
import type { PackageItemValues } from '../../schemas'

type PackageItemPanelProps = { open: boolean; isEdit: boolean; initial: PackageItemValues; onClose: () => void; onSave: (values: PackageItemValues) => void }

/** Right-side panel to add or edit one package item, so the wizard page stays short. */
export function PackageItemPanel({ open, isEdit, initial, onClose, onSave }: PackageItemPanelProps) {
  const { register, errors, onSubmit } = usePackageItemForm({ open, initial, onSave })

  return <Drawer open={open} onClose={onClose} panelClassName="flex h-full w-full max-w-[440px] flex-col bg-white shadow-[-20px_0_60px_rgba(9,38,28,.16)]">
    <div className="flex shrink-0 items-center gap-3 border-b border-[#E4EBE7] px-5 py-4 sm:px-6">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF6ED] text-[#438352]"><Icon name="box" size={19}/></span>
      <div className="min-w-0 flex-1"><ModalTitle className="text-base font-black text-[#17382C]">{isEdit ? 'Edit package item' : 'Add package item'}</ModalTitle><div className="mt-0.5 text-[11px] text-[#899890]">Enter the item’s details</div></div>
      <button type="button" aria-label="Close" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E0E8E3] text-[#667870]"><Icon name="close" size={17}/></button>
    </div>
    {/* A separate form: the panel is portalled outside the wizard's form. */}
    <form noValidate onSubmit={event => { event.stopPropagation(); void onSubmit(event) }} className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
        <Field label="Product name" placeholder="e.g. Handmade leather bag" autoFocus error={errors.name?.message} {...register('name')}/>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Quantity" type="number" min={1} inputMode="numeric" {...register('quantity')}/>
          <Field label="Item value" type="number" min={0} inputMode="decimal" placeholder="0.00" suffix="NGN" {...register('amount')}/>
        </div>
        <Field label="Package weight" type="number" min={0} step="0.1" inputMode="decimal" placeholder="0.0" suffix="kg" hint="Use the combined package weight" error={errors.weight?.message} {...register('weight')}/>
      </div>
      <div className="flex shrink-0 gap-3 border-t border-[#E4EBE7] px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
        <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
        <Button type="submit" icon={isEdit ? 'check' : 'plus'} className="flex-1">{isEdit ? 'Save item' : 'Add item'}</Button>
      </div>
    </form>
  </Drawer>
}
