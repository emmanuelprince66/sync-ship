import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useDeleteShippingMethod, useSaveShippingMethod, useShippingMethods, type ShippingMethod } from '@/api/shipping-settings'
import { formatNaira } from '@/lib/format'
import { shippingMethodFormDefaults, shippingMethodFormSchema, type ShippingMethodFormValues } from '../shippingSchemas'

const formatDate = (value: string) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

/**
 * In-house shipping methods — sink-inventory's Shipping page (useShippingHook):
 * location, fee (empty = no fee), description and "visible on web checkout".
 * Toasts come from the mutations, with sink-inventory's messages.
 */
export const useShippingMethodsCard = () => {
  const methods = useShippingMethods()
  const saveMethod = useSaveShippingMethod()
  const deleteMethod = useDeleteShippingMethod()
  /** undefined = closed, null = adding, a method = editing it. */
  const [editing, setEditing] = useState<ShippingMethod | null | undefined>(undefined)
  const [pendingDelete, setPendingDelete] = useState<ShippingMethod | null>(null)
  const form = useForm<ShippingMethodFormValues>({ resolver: zodResolver(shippingMethodFormSchema), defaultValues: shippingMethodFormDefaults })

  const openEditor = (method: ShippingMethod | null) => {
    form.reset(method
      ? { location: method.location, fee: method.amount === null ? '' : String(method.amount), description: method.description, visible: method.visible }
      : shippingMethodFormDefaults)
    setEditing(method)
  }

  const submit = form.handleSubmit(values => {
    saveMethod.mutate(
      { id: editing?.id, input: { location: values.location.trim(), amount: values.fee || null, description: values.description.trim(), visible: values.visible } },
      { onSuccess: () => setEditing(undefined) },
    )
  })

  const confirmDelete = () => {
    if (!pendingDelete) return
    deleteMethod.mutate(pendingDelete.id, { onSuccess: () => setPendingDelete(null) })
  }

  return {
    methods: (methods.data ?? []).map(method => ({ ...method, feeLabel: method.amount === null ? '—' : formatNaira(method.amount), createdLabel: formatDate(method.createdAt) })),
    isLoading: methods.isLoading,
    editor: { isOpen: editing !== undefined, isEditing: Boolean(editing), open: openEditor, close: () => setEditing(undefined), form, submit, saving: saveMethod.isPending },
    remove: { pending: pendingDelete, ask: setPendingDelete, cancel: () => setPendingDelete(null), confirm: confirmDelete, deleting: deleteMethod.isPending },
  }
}

export type ShippingMethodRow = ReturnType<typeof useShippingMethodsCard>['methods'][number]
