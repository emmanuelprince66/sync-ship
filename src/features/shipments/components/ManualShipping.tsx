import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { formatNaira } from '@/lib/format'
import type { useOrderDetails } from '../hooks/useShipmentDrawer'

type Order = ReturnType<typeof useOrderDetails>

const SECTION = 'rounded-2xl border border-[#E1E9E4] p-5'

/** How the order is delivered and what delivery costs: the shipping location price the business set, or the courier rate picked. */
export function DeliveryCard({ order }: { order: Order }) {
  const { delivery } = order
  const rows = [
    { label: 'Method', value: delivery.method },
    ...(delivery.partner ? [{ label: 'Courier', value: delivery.partner }] : []),
    { label: 'Delivery fee', value: delivery.feeLabel, strong: true },
    ...(delivery.total != null && delivery.fee ? [{ label: 'Items', value: formatNaira(Math.max(delivery.total - delivery.fee, 0)) }] : []),
    ...(delivery.amountPaid != null ? [{ label: 'Amount paid', value: formatNaira(delivery.amountPaid) }] : []),
  ]
  return <div className={SECTION}>
    <div className="mb-4 text-xs font-extrabold text-[#17382C]">Delivery</div>
    <dl className="space-y-3.5">{rows.map(row => <div key={row.label} className="flex items-center justify-between gap-3 text-[11px]">
      <dt className="text-[#7D8D85]">{row.label}</dt>
      <dd className={cn('text-right', row.strong ? 'font-black text-[#17382C]' : 'font-bold text-[#28483B]')}>{row.value}</dd>
    </div>)}</dl>
  </div>
}

/** sink's manual "Update Status" for orders not on automated shipping: pick Shipping / Delivered / Returned, then save. */
export function ManualStatusCard({ order }: { order: Order }) {
  const { manual } = order
  if (!manual.show) return null
  return <div className={SECTION}>
    <div className="text-xs font-extrabold text-[#17382C]">Update shipping status</div>
    <p className="mt-1.5 text-[10px] leading-4 text-[#829189]">You deliver this order yourself, so move it along as it happens.</p>
    <div className="mt-5 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Shipping status">
      {manual.options.map(option => {
        const active = manual.picked === option.value
        return <button key={option.value} type="button" role="radio" aria-checked={active} onClick={() => manual.pick(option.value)}
          className={cn('rounded-xl border px-3.5 py-3 text-left transition', active ? 'border-[#529661] bg-[#F4FAF3]' : 'border-[#DDE7E1] bg-white hover:border-[#BDD4C3]')}>
          <span className={cn('block text-[11px] font-extrabold', active ? 'text-[#29483B]' : 'text-[#5E7168]')}>{option.label}{manual.current === option.value && <span className="ml-1 font-bold text-[#8A9992]">· now</span>}</span>
          <span className="mt-1 block text-[10px] leading-4 text-[#8A9992]">{option.hint}</span>
        </button>
      })}
    </div>
    <div className="mt-6"><Button onClick={manual.save} loading={manual.saving} disabled={!manual.canSave} className="w-full">Update status</Button></div>
  </div>
}
