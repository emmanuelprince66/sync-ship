import { useState } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useUpdateItem } from '@/api/items'
import type { CatalogItem } from '@/api/types'

/** Draft price for one item. Remount (via `key`) per item so the draft resets. */
export function useEditPrice(item: CatalogItem | null, onClose: () => void) {
  const [price, setPrice] = useState(item?.price ?? '')
  const updateItem = useUpdateItem()
  const invalid = price.trim() === '' || Number(price) < 0

  const save = () => {
    if (!item || invalid) return
    updateItem.mutate({ ...item, price: price.trim() }, {
      onSuccess: () => { toast.success('Price updated'); onClose() },
      onError: error => toast.error(errorMessage(error, 'Could not update the price')),
    })
  }

  return { price, setPrice, invalid, save, isSaving: updateItem.isPending }
}
