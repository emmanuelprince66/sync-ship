import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useAddItem, useUpdateItem } from '@/api/items'
import type { CatalogItem } from '@/api/types'
import { useImageUpload } from '@/hooks/useImageUpload'
import { itemFormDefaults, itemFormSchema, type ItemFormValues } from '../schemas'

const toValues = (item: CatalogItem | null): ItemFormValues => (item
  ? { name: item.name, description: item.description ?? '', price: item.price, weight: Number(item.weight) ? item.weight : '', image: item.image, available: item.inStock, listed: item.listed !== false }
  : itemFormDefaults)

/** Add or edit one item. `item` null means a new item. */
export function useItemForm({ open, item, onClose }: { open: boolean; item: CatalogItem | null; onClose: () => void }) {
  const addItem = useAddItem()
  const updateItem = useUpdateItem()
  const form = useForm<ItemFormValues>({ resolver: zodResolver(itemFormSchema), defaultValues: toValues(item) })
  const { reset, setValue, control, register, handleSubmit, formState: { errors } } = form
  const [image, available, listed] = useWatch({ control, name: ['image', 'available', 'listed'] })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const pickImage = useImageUpload(useCallback((dataUrl: string, file: File) => { setValue('image', dataUrl); setImageFile(file) }, [setValue]), 5)

  // Forget a picked file whenever the modal opens or switches item.
  const openKey = open ? String(item?.id ?? 'new') : ''
  const [seenKey, setSeenKey] = useState(openKey)
  if (openKey !== seenKey) { setSeenKey(openKey); setImageFile(null) }

  useEffect(() => {
    if (open) reset(toValues(item))
    // Reset only when the modal opens or switches item.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item?.id])

  const onSubmit = handleSubmit(values => {
    const onError = (error: unknown) => toast.error(errorMessage(error, 'Could not save the item'))
    if (item) {
      updateItem.mutate(
        { ...item, name: values.name.trim(), description: values.description.trim(), price: values.price, weight: values.weight || '0', image: values.image, imageFile, inStock: values.available, listed: values.listed },
        { onSuccess: () => { toast.success('Item updated'); onClose() }, onError },
      )
    } else {
      addItem.mutate({ ...values, imageFile }, { onSuccess: created => { toast.success(`${created.name} added to your items`); onClose() }, onError })
    }
  })

  return {
    register,
    errors,
    image,
    pickImage,
    available,
    listed,
    setAvailable: (value: boolean) => setValue('available', value),
    setListed: (value: boolean) => setValue('listed', value),
    isEdit: Boolean(item),
    isSaving: addItem.isPending || updateItem.isPending,
    onSubmit,
  }
}
