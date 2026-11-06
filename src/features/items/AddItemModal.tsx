import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { FilePicker } from '@/components/ui/common'
import { Modal, ModalHeader } from '@/components/ui/Modal'
import { useAddItemForm } from './hooks/useAddItemForm'

export function AddItemModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { register, errors, image, canSave, isSaving, uploadImage, onSubmit, close } = useAddItemForm(onClose)

  return <Modal open={open} onClose={close} panelClassName="w-full max-w-lg rounded-3xl bg-white p-6 shadow-[0_25px_80px_rgba(9,38,28,.2)]">
    <form onSubmit={onSubmit} noValidate>
      <ModalHeader title="Add an item" description="Save it to your item list and storefront." onClose={close}/>
      <FilePicker accept="image/*" onFile={uploadImage} className="mt-6 block"><span className="mb-2 block text-[12px] font-extrabold text-[#34483F]">Item picture</span><div className="flex h-36 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[#C9D8CF] bg-[#F8FAF8]">{image ? <img src={image} alt="Item preview" className="h-full w-full object-cover"/> : <div className="text-center text-[#708179]"><div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF5E9] text-[#438352]"><Icon name="plus" size={19}/></div><div className="mt-2 text-[10px] font-bold">Click to upload a picture</div></div>}</div></FilePicker>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Field label="Item name" placeholder="e.g. Classic leather handbag" error={errors.name?.message} {...register('name')}/></div>
        <Field label="Weight" type="number" placeholder="0.0" suffix="kg" step="any" min="0" error={errors.weight?.message} {...register('weight')}/>
        <Field label="Selling price" type="number" placeholder="0.00" suffix="NGN" step="any" min="0" error={errors.price?.message} {...register('price')}/>
      </div>
      <div className="mt-6 flex justify-end gap-2"><Button variant="ghost" onClick={close}>Cancel</Button><Button type="submit" loading={isSaving} disabled={!canSave}>Save item</Button></div>
    </form>
  </Modal>
}
