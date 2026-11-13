import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { packageItemSchema, type PackageItemValues } from '../schemas'

/** Local form for editing one package line; resets to that line each time the editor opens. */
export function usePackageItemForm({ open, initial, onSave }: { open: boolean; initial: PackageItemValues; onSave: (values: PackageItemValues) => void }) {
  const form = useForm<PackageItemValues>({ resolver: zodResolver(packageItemSchema), defaultValues: initial })
  const { reset, control, setValue } = form
  const [quantity, weight] = useWatch({ control, name: ['quantity', 'weight'] })

  useEffect(() => {
    if (open) reset(initial)
    // Reset only when the editor opens, not on every keystroke upstream.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return {
    register: form.register,
    errors: form.formState.errors,
    quantity: Number(quantity) || 1,
    setQuantity: (value: number) => setValue('quantity', String(value), { shouldDirty: true, shouldValidate: true }),
    /** Blank weight: the business's default package weight is used. */
    usesDefaultWeight: !(Number(weight) > 0),
    // Keep the saved-product link when editing a line picked from the list.
    onSubmit: form.handleSubmit(values => onSave({ ...values, productId: initial.productId, catalogId: initial.catalogId })),
  }
}
