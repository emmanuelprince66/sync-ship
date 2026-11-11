import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { apiErrorText } from '@/api/http'
import { useAddItem, useUpdateItem, type SkuProduct } from '@/api/items'
import type { CatalogItem } from '@/api/types'
import { itemFormDefaults, itemFormSchema, type ItemFormValues } from '../schemas'
import { useItemGallery } from './useItemGallery'
import { useSkuPrefill } from './useSkuPrefill'

const toValues = (item: CatalogItem | null): ItemFormValues => (item
  ? { name: item.name, description: item.description ?? '', price: item.price, weight: Number(item.weight) ? item.weight : '', available: item.inStock, listed: item.listed !== false }
  : itemFormDefaults)

/** Add or edit one item, with its picture gallery and (when adding) a SKU lookup that fills it in. */
export function useItemForm({ open, item, onClose }: { open: boolean; item: CatalogItem | null; onClose: () => void }) {
  const addItem = useAddItem()
  const updateItem = useUpdateItem()
  const form = useForm<ItemFormValues>({ resolver: zodResolver(itemFormSchema), defaultValues: toValues(item) })
  const { reset, setValue, control, register, handleSubmit, formState: { errors } } = form
  const [available, listed] = useWatch({ control, name: ['available', 'listed'] })
  const gallery = useItemGallery()

  const fillFromSku = async (product: SkuProduct) => {
    const filled = ['name']
    setValue('name', product.name, { shouldValidate: true, shouldDirty: true })
    if (product.description) { setValue('description', product.description, { shouldDirty: true }); filled.push('description') }
    if (product.price) { setValue('price', product.price, { shouldValidate: true, shouldDirty: true }); filled.push('price') }
    if (product.imageUrl) { await gallery.addRemote(product.imageUrl); filled.push('picture') }
    return filled
  }
  const sku = useSkuPrefill(fillFromSku)

  useEffect(() => {
    if (!open) return
    reset(toValues(item))
    gallery.reset(item)
    sku.reset()
    // Reset only when the modal opens or switches item.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item?.id])

  const onSubmit = handleSubmit(values => {
    const onError = (error: unknown) => toast.error(apiErrorText(error, 'Could not save the item'))
    if (item) {
      updateItem.mutate(
        { ...item, name: values.name.trim(), description: values.description.trim(), price: values.price, weight: values.weight || '0', inStock: values.available, listed: values.listed, gallery: gallery.toChange(true) },
        { onSuccess: () => { toast.success('Item updated'); onClose() }, onError },
      )
      return
    }
    const pictures = gallery.toChange(false)
    addItem.mutate(
      { ...values, image: pictures?.previewUrls[0] ?? '', newImages: pictures?.newImages, imageUrl: pictures?.imageUrl ?? undefined, previewUrls: pictures?.previewUrls },
      { onSuccess: created => { toast.success(`${created.name} added to your items`); onClose() }, onError },
    )
  })

  return {
    register,
    errors,
    gallery,
    sku,
    available,
    listed,
    setAvailable: (value: boolean) => setValue('available', value),
    setListed: (value: boolean) => setValue('listed', value),
    isEdit: Boolean(item),
    isSaving: addItem.isPending || updateItem.isPending,
    onSubmit,
  }
}
