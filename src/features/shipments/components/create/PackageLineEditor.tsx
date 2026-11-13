import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Modal, ModalHeader } from '@/components/ui/Modal'
import { QuantityStepper } from '@/components/ui/QuantityStepper'
import { usePackageItemForm } from '../../hooks/usePackageItemForm'
import type { PackageItemValues } from '../../schemas'

type PackageLineEditorProps = { open: boolean; initial: PackageItemValues; maxQuantity: number; onClose: () => void; onSave: (values: PackageItemValues) => void }

/** Edits one package line for this shipment only: name, value, weight and quantity. */
export function PackageLineEditor({ open, initial, maxQuantity, onClose, onSave }: PackageLineEditorProps) {
  const form = usePackageItemForm({ open, initial, onSave })

  return <Modal open={open} onClose={onClose} overlayClassName="bg-[#09261C]/40 p-0 backdrop-blur-[2px] sm:p-4" panelClassName="flex max-h-[100dvh] w-full flex-col self-end rounded-t-3xl bg-white shadow-[0_25px_80px_rgba(9,38,28,.2)] sm:max-h-[calc(100dvh-2rem)] sm:max-w-md sm:self-center sm:rounded-3xl">
    <ModalHeader title="Edit package item" description="Changes apply to this shipment only." onClose={onClose} className="shrink-0 border-b border-[#EDF1EF] px-5 py-4 sm:px-6"/>
    {/* A separate form: the modal is portalled outside the wizard's form. */}
    <form noValidate onSubmit={event => { event.stopPropagation(); void form.onSubmit(event) }} className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
        <Field label="Product name" placeholder="e.g. Handmade leather bag" error={form.errors.name?.message} {...form.register('name')}/>
        <div>
          <span className="mb-2 block text-[12px] font-extrabold text-[#34483F]">Quantity</span>
          <QuantityStepper value={form.quantity} onChange={form.setQuantity} max={maxQuantity} label="Quantity"/>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Item value" type="number" min={0} inputMode="decimal" placeholder="0.00" suffix="NGN" {...form.register('amount')}/>
          <Field label="Weight" type="number" min={0} step="0.1" inputMode="decimal" placeholder="0.0" suffix="kg" error={form.errors.weight?.message} {...form.register('weight')}/>
        </div>
        <p className="-mt-2 text-[11px] leading-4 text-[#7C8D85]">{form.usesDefaultWeight ? 'No weight: uses your default package weight.' : 'Weight of one item, used for the delivery rate.'}</p>
      </div>
      <div className="flex shrink-0 gap-3 border-t border-[#EDF1EF] px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
        <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
        <Button type="submit" icon="check" className="flex-1">Save item</Button>
      </div>
    </form>
  </Modal>
}
