import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { errorMessage } from '@/api/auth'
import { useSettlementAccounts } from '@/api/banks'
import { useMarkOrderPaid } from '@/api/shipments'
import type { Shipment } from '@/api/types'
import { formatNaira } from '@/lib/format'

const schema = z
  .object({
    status: z.enum(['PAID', 'PARTIAL']),
    method: z.enum(['BANK', 'CASH']),
    bankId: z.string(),
    amount: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.method === 'BANK' && !values.bankId) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['bankId'], message: 'Select the bank the money went into' })
    if (!(Number(values.amount) > 0)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['amount'], message: 'Enter the amount received' })
  })

type Values = z.infer<typeof schema>

const STATUS_LABELS: Record<string, { label: string; tone: 'ok' | 'warn' | 'due' }> = {
  PAID: { label: 'Paid', tone: 'ok' },
  PARTIAL: { label: 'Part paid', tone: 'warn' },
  UNPAID: { label: 'Not paid', tone: 'due' },
}

/** sink-inventory's "Update payment" on an order: PATCH order/mark-paid/{id}/ with status, amount, method, bank. */
export function useUpdatePayment(shipment: Shipment) {
  const [editing, setEditing] = useState(false)
  const accounts = useSettlementAccounts()
  const mutation = useMarkOrderPaid()
  const total = shipment.amountValue ?? 0
  const current = (shipment.paymentStatus || 'UNPAID').toUpperCase()

  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { status: 'PAID', method: 'BANK', bankId: '', amount: total ? String(total) : '' } })
  const [status, method] = useWatch({ control: form.control, name: ['status', 'method'] })

  const submit = form.handleSubmit(values => {
    if (!shipment.orderId) return toast.error('This order can’t be updated here.')
    mutation.mutate(
      { orderId: shipment.orderId, status: values.status, amount: Number(values.amount), method: values.method, bankId: values.bankId || undefined },
      {
        onSuccess: () => { toast.success('Payment updated'); setEditing(false) },
        onError: error => toast.error(errorMessage(error, 'Could not update the payment. Please try again.')),
      },
    )
  })

  return {
    statusLabel: STATUS_LABELS[current]?.label ?? current,
    tone: STATUS_LABELS[current]?.tone ?? 'due',
    totalLabel: formatNaira(total),
    canUpdate: Boolean(shipment.orderId) && current !== 'PAID',
    editing,
    startEditing: () => setEditing(true),
    cancel: () => setEditing(false),
    status,
    method,
    setStatus: (value: Values['status']) => {
      form.setValue('status', value)
      if (value === 'PAID' && total) form.setValue('amount', String(total))
    },
    setMethod: (value: Values['method']) => form.setValue('method', value),
    register: form.register,
    errors: form.formState.errors,
    bankOptions: (accounts.data ?? []).map(account => ({ id: account.id, label: `${account.bankName} · ${account.accountNumber}` })),
    submit,
    saving: mutation.isPending,
  }
}
