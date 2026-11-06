import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Modal, ModalTitle } from '@/components/ui/Modal'
import { useBulkPrice } from './hooks/useBulkPrice'

export function BulkPriceModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { priceChange, setPriceChange, examplePrice, apply, isSaving } = useBulkPrice(onClose)

  return <Modal open={open} onClose={onClose} overlayClassName="bg-[#09261C]/40 p-4" panelClassName="w-full max-w-md rounded-3xl bg-white p-7">
    <ModalTitle className="text-lg font-black text-[#17382C]">Increase item prices</ModalTitle>
    <div className="mt-1 text-xs text-[#819088]">Apply a percentage increase to every listed item.</div>
    <div className="mt-6"><Field label="Percentage increase" type="number" suffix="%" value={priceChange} onValueChange={setPriceChange}/></div>
    <div className="mt-5 rounded-xl bg-[#F3F7F4] p-4 text-[10px] leading-5 text-[#60736A]">Example: a ₦48,000 item becomes <strong className="text-[#286B43]">{examplePrice}</strong>.</div>
    <div className="mt-6 flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={apply} loading={isSaving}>Update all prices</Button></div>
  </Modal>
}
