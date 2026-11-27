import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { apiErrorText } from '@/api/http'
import { useAddItem, useUpdateItem, type SkuProduct } from '@/api/items'
import type { CatalogItem } from '@/api/types'
import { itemFormDefaults, itemFormSchema, type ItemFormValues } from '../schemas'
import { useItemGallery } from './useItemGallery'
import { useSkuPrefill } from './useSkuPrefill'

const toValues = (item: CatalogItem | null): ItemFormValues => (item
  ? { name: item.name, description: item.description ?? '', price: item.price, weight: Number(item.weight) ? item.weight : '', sku: item.sku ?? '', available: item.inStock, listed: item.listed !== false, sizes: (item.sizes ?? []).map(size => ({ id: size.id, name: size.name, price: size.price })) }
  : itemFormDefaults)

/**
 * Add or edit one item, with its picture gallery and (when adding) a SKU lookup that fills it in.
 * `onSaved` receives the saved item (e.g. the shipment flow adds a new item to the package).
 */
export function useItemForm({ open, item, onClose, onSaved }: { open: boolean; item: CatalogItem | null; onClose: () => void; onSaved?: (item: CatalogItem) => void }) {
  const addItem = useAddItem()
  const updateItem = useUpdateItem()
  const form = useForm<ItemFormValues>({ resolver: zodResolver(itemFormSchema), defaultValues: toValues(item) })
  const { reset, setValue, control, register, handleSubmit, formState: { errors } } = form
  const [available, listed, weight] = useWatch({ control, name: ['available', 'listed', 'weight'] })
  const gallery = useItemGallery()
  const sizeRows = useFieldArray({ control, name: 'sizes' })
  const cleanSizes = (sizes: ItemFormValues['sizes']) => {
    // Blank rows are dropped; the same size typed twice is kept once.
    const seen = new Set<string>()
    return sizes.map(size => ({ ...size, name: size.name.trim() })).filter(size => {
      const key = size.name.toLowerCase()
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  const fillFromSku = async (product: SkuProduct) => {
    const filled = ['name']
    setValue('sku', product.sku, { shouldDirty: true })
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
        { ...item, name: values.name.trim(), description: values.description.trim(), price: values.price, weight: values.weight || '0', sku: values.sku, inStock: values.available, listed: values.listed, sizes: cleanSizes(values.sizes), gallery: gallery.toChange(true) },
        { onSuccess: saved => { toast.success('Item updated'); onSaved?.(saved); onClose() }, onError },
      )
      return
    }
    const pictures = gallery.toChange(false)
    addItem.mutate(
      { ...values, sizes: cleanSizes(values.sizes), sku: values.sku || sku.sku.trim(), image: pictures?.previewUrls[0] ?? '', newImages: pictures?.newImages, imageUrl: pictures?.imageUrl ?? undefined, previewUrls: pictures?.previewUrls },
      { onSuccess: created => { toast.success(`${created.name} added to your items`); onSaved?.(created); onClose() }, onError },
    )
  })

  return {
    register,
    errors,
    gallery,
    sku,
    available,
    listed,
    /** Blank (or 0) weight: the backend uses the business's default package weight. */
    usesDefaultWeight: !(Number(weight) > 0),
    /** Sizes customers pick from: type a name and add it; a price only when it costs differently. */
    sizes: {
      rows: sizeRows.fields,
      add: (name: string) => {
        const clean = name.trim()
        if (!clean) return
        if (form.getValues('sizes').some(size => size.name.trim().toLowerCase() === clean.toLowerCase())) return
        sizeRows.append({ name: clean, price: '' })
      },
      remove: sizeRows.remove,
      register: (index: number, field: 'name' | 'price') => register(`sizes.${index}.${field}`),
      error: (index: number) => errors.sizes?.[index]?.name?.message ?? errors.sizes?.[index]?.price?.message,
    },
    setAvailable: (value: boolean) => setValue('available', value),
    setListed: (value: boolean) => setValue('listed', value),
    isEdit: Boolean(item),
    isSaving: addItem.isPending || updateItem.isPending,
    onSubmit,
  }
}
