import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { packageItemSchema, type PackageItemValues } from '../schemas'

/** Local form for the package-item side panel; resets to the item being added or edited each time it opens. */
export function usePackageItemForm({ open, initial, onSave }: { open: boolean; initial: PackageItemValues; onSave: (values: PackageItemValues) => void }) {
  const form = useForm<PackageItemValues>({ resolver: zodResolver(packageItemSchema), defaultValues: initial })
  const { reset } = form

  useEffect(() => {
    if (open) reset(initial)
    // Reset only when the panel opens, not on every keystroke upstream.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return {
    register: form.register,
    errors: form.formState.errors,
    // Keep the saved-product link when editing an item picked from the list.
    onSubmit: form.handleSubmit(values => onSave({ ...values, productId: initial.productId })),
  }
}
