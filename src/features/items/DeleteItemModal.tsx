import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useDeleteItem } from '@/api/items'
import type { CatalogItem } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { Modal, ModalFooter, ModalHeader } from '@/components/ui/Modal'

function useDeleteItemConfirm(item: CatalogItem | null, onClose: () => void) {
  const remove = useDeleteItem()
  return {
    isDeleting: remove.isPending,
    confirm: () => {
      if (!item) return
      remove.mutate(item, {
        onSuccess: () => { toast.success(`${item.name} deleted`); onClose() },
        onError: error => toast.error(errorMessage(error, 'Could not delete the item')),
      })
    },
  }
}

export function DeleteItemModal({ item, onClose }: { item: CatalogItem | null; onClose: () => void }) {
  const { isDeleting, confirm } = useDeleteItemConfirm(item, onClose)
  return <Modal open={Boolean(item)} onClose={onClose} panelClassName="w-full max-w-md rounded-3xl bg-white p-6 shadow-[0_25px_80px_rgba(9,38,28,.2)]">
    <ModalHeader title="Delete this item?" description={`${item?.name ?? 'This item'} will be removed from your item list and storefront. Past orders keep their details.`} align="start" onClose={onClose}/>
    <ModalFooter><Button variant="ghost" onClick={onClose}>Cancel</Button><Button icon="trash" loading={isDeleting} onClick={confirm} className="bg-[#C2483D] shadow-none hover:bg-[#A93C32]">Delete item</Button></ModalFooter>
  </Modal>
}
