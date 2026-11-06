import { createColumnHelper } from '@tanstack/react-table'
import type { PendingBnplOrder } from '@/api/bnpl'
import { formatNaira } from '@/lib/format'
import { BnplStageBadge } from './BnplBadges'

const column = createColumnHelper<PendingBnplOrder>()

const asDate = (value: string | null) => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}
export const formatBnplDay = (value: string | null) => asDate(value)?.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) ?? '—'
const formatTime = (value: string | null) => asDate(value)?.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) ?? ''

/**
 * Gross, fee and net each get a column (sink's PendingBnplColumn): the point of
 * the screen is the gap between what the customer was charged and what lands.
 */
export const pendingBnplColumns = [
  column.accessor('orderReference', {
    header: 'Order',
    meta: { headerClassName: 'px-5', cellClassName: 'px-5' },
    cell: ({ getValue }) => <span className="text-xs font-extrabold text-[#438352]">{getValue()}</span>,
  }),
  column.accessor('customer', {
    header: 'Customer',
    // A walk-in was never tied to a customer record — say so rather than a dash.
    cell: ({ getValue }) => <div className="min-w-0"><div className="text-xs font-bold text-[#34483F]">{getValue()?.name ?? 'Walk-in customer'}</div>{getValue()?.phone && <div className="mt-0.5 text-[10px] text-[#91A098]">{getValue()?.phone}</div>}</div>,
  }),
  column.accessor('orderDate', {
    header: 'Date',
    // Once paid out, when it landed is the more useful of the two dates.
    cell: ({ row: { original } }) => <div><div className="text-xs text-[#53665D]">{formatBnplDay(original.orderDate)}</div>{original.settledAt ? <div className="mt-0.5 text-[10px] font-bold text-[#3C7F4C]">Paid {formatBnplDay(original.settledAt)}</div> : <div className="mt-0.5 text-[10px] text-[#91A098]">{formatTime(original.orderDate)}</div>}</div>,
  }),
  column.accessor('stage', {
    header: 'Stage',
    cell: ({ row: { original } }) => <BnplStageBadge stage={original.stage} label={original.stageLabel} description={original.stageDescription}/>,
  }),
  column.accessor('orderAmount', { header: 'Order amount', cell: ({ getValue }) => <span className="text-xs text-[#53665D]">{formatNaira(getValue())}</span> }),
  column.accessor('feeDeducted', {
    header: 'Fee',
    cell: ({ row: { original } }) => <div><div className="text-xs font-bold text-[#C2483D]">−{formatNaira(original.feeDeducted)}</div><div className="mt-0.5 text-[10px] text-[#91A098]">{original.feeRate}</div></div>,
  }),
  column.accessor('netSettlementAmount', { header: 'You receive', cell: ({ getValue }) => <span className="text-xs font-black text-[#17382C]">{formatNaira(getValue())}</span> }),
]
