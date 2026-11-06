export type BnplOrderStatus = { tone: 'success' | 'pending' | 'error'; label: string; detail: string }

/**
 * BNPL status of an order, with sink-inventory's wording (pos/instoreDraft.ts):
 * paid + BNPL → "Paid — BNPL approved"; bnpl_status PENDING → "Awaiting Akawopay";
 * REJECTED → "BNPL declined". Returns null for non-BNPL orders.
 */
export function bnplOrderStatus({ paymentType, bnplStatus, paid }: { paymentType?: string | null; bnplStatus?: string | null; paid?: boolean }): BnplOrderStatus | null {
  const status = (bnplStatus ?? '').toUpperCase()
  const isBnpl = (paymentType ?? '').toUpperCase() === 'BNPL' || Boolean(status)
  if (!isBnpl) return null
  if (paid || status === 'APPROVED') return { tone: 'success', label: 'Paid — BNPL approved', detail: 'Payment is confirmed. Check the items against the bag, then release them. No payment to collect.' }
  if (status === 'REJECTED') return { tone: 'error', label: 'BNPL declined', detail: 'Akawopay declined this request. The customer can pay here by cash, card or transfer instead.' }
  return { tone: 'pending', label: 'Awaiting Akawopay', detail: 'The customer\'s installment plan hasn\'t been approved yet. Refresh in a moment — don\'t release anything.' }
}

