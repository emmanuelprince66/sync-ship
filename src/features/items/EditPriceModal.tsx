import type { CatalogItem } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Modal, ModalTitle } from '@/components/ui/Modal'
import { useEditPrice } from './hooks/useEditPrice'

/** Mount with a `key` per item so the draft price resets for each item. */
export function EditPriceModal({ item, onClose }: { item: CatalogItem | null; onClose: () => void }) {
  const { price, setPrice, invalid, save, isSaving } = useEditPrice(item, onClose)

  return <Modal open={item !== null} onClose={onClose} overlayClassName="bg-[#09261C]/40 p-4" panelClassName="w-full max-w-md rounded-3xl bg-white p-7">
    {item && <>
      <div className="flex items-center gap-3"><img src={item.image} alt="" className="h-12 w-12 rounded-xl object-cover"/><div><ModalTitle className="text-sm font-black text-[#17382C]">Edit selling price</ModalTitle><div className="text-[10px] text-[#819088]">{item.name}</div></div></div>
      <div className="mt-6"><Field label="New price" type="number" suffix="NGN" min="0" value={price} onValueChange={setPrice}/></div>
      <div className="mt-6 flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={invalid} loading={isSaving}>Save price</Button></div>
    </>}
  </Modal>
}
