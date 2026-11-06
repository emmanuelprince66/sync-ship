import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useDeleteShippingMethod, useSaveShippingMethod, useShippingMethods, type ShippingMethod } from '@/api/shipping-settings'
import { formatNaira } from '@/lib/format'
import { shippingMethodDefaults, shippingMethodSchema, type ShippingMethodValues } from '../schemas'

/**
 * In-house delivery rates (sink-inventory's Shipping methods): a flat fee per
 * area, or free (empty fee). Used when you deliver yourself instead of Shipbubble.
 */
export const useShippingMethodsCard = () => {
  const methods = useShippingMethods()
  const saveMethod = useSaveShippingMethod()
  const deleteMethod = useDeleteShippingMethod()
  /** undefined = closed, null = adding, a method = editing it. */
  const [editing, setEditing] = useState<ShippingMethod | null | undefined>(undefined)
  const [pendingDelete, setPendingDelete] = useState<ShippingMethod | null>(null)
  const form = useForm<ShippingMethodValues>({ resolver: zodResolver(shippingMethodSchema), defaultValues: shippingMethodDefaults })

  const openEditor = (method: ShippingMethod | null) => {
    form.reset(method ? { location: method.location, fee: method.amount === null ? '' : String(method.amount), description: method.description } : shippingMethodDefaults)
    setEditing(method)
  }

  const submit = form.handleSubmit(values => {
    const amount = values.fee === '' || Number(values.fee) === 0 ? null : Number(values.fee)
    saveMethod.mutate({ id: editing?.id, input: { location: values.location.trim(), amount, description: values.description.trim() } }, {
      onSuccess: () => { toast.success(editing ? 'Delivery rate updated' : 'Delivery rate added'); setEditing(undefined) },
      onError: error => toast.error(errorMessage(error)),
    })
  })

  const confirmDelete = () => {
    if (!pendingDelete) return
    deleteMethod.mutate(pendingDelete.id, {
      onSuccess: () => { toast.success('Delivery rate removed'); setPendingDelete(null) },
      onError: error => toast.error(errorMessage(error)),
    })
  }

  return {
    methods: (methods.data ?? []).map(method => ({ ...method, feeLabel: method.amount === null ? 'Free' : formatNaira(method.amount) })),
    isLoading: methods.isLoading,
    editor: { isOpen: editing !== undefined, isEditing: Boolean(editing), open: openEditor, close: () => setEditing(undefined), form, submit, saving: saveMethod.isPending },
    remove: { pending: pendingDelete, ask: setPendingDelete, cancel: () => setPendingDelete(null), confirm: confirmDelete, deleting: deleteMethod.isPending },
  }
}

export type ShippingMethodRow = ReturnType<typeof useShippingMethodsCard>['methods'][number]
