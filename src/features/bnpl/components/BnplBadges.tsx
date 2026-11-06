import { cn } from '@/lib/cn'
import { bnplOrderStatus } from '../orderStatus'

/**
 * Settlement-stage tones (sink's PendingBnplColumn): settled reads as done, a
 * retry is the only one that has actually gone wrong, so it stands out.
 */
const STAGE_TONES: Record<string, string> = {
  SETTLED: 'bg-[#E4F2E1] text-[#3C7F4C]',
  PROCESSING_PAYOUT: 'bg-[#E8F0FC] text-[#426AB2]',
  FAILED_RETRYING: 'bg-[#FDECEA] text-[#C2483D]',
  AWAITING_SETTLEMENT: 'bg-[#FFF4D9] text-[#A16A15]',
}

/** Payout stage of one Akawopay settlement; the full description rides on the tooltip. */
export function BnplStageBadge({ stage, label, description }: { stage: string; label: string; description?: string }) {
  return <span title={description} className={cn('inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-extrabold', STAGE_TONES[stage.toUpperCase()] ?? 'bg-[#F0F4F1] text-[#53665D]')}>{label}</span>
}

const STATUS_TONES = {
  success: 'bg-[#E4F2E1] text-[#3C7F4C]',
  pending: 'bg-[#FFF4D9] text-[#A16A15]',
  error: 'bg-[#FDECEA] text-[#C2483D]',
} as const

/** Badge for a BNPL order (shipments/orders tables and the order drawer). Renders nothing for non-BNPL orders. */
export function BnplStatusBadge(props: { paymentType?: string | null; bnplStatus?: string | null; paid?: boolean; className?: string }) {
  const status = bnplOrderStatus(props)
  if (!status) return null
  return <span title={status.detail} className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-extrabold', STATUS_TONES[status.tone], props.className)}><span className="h-1.5 w-1.5 rounded-full bg-current"/>{status.label}</span>
}
