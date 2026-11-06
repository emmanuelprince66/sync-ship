import type { Shipment } from '@/api/types'
import { Icon } from '@/components/ui/Icon'
import { BnplStatusBadge } from '@/features/bnpl'
import { StatusBadge } from './StatusBadge'

/** Phone layout for one shipment row: tap anywhere to open details. */
export function ShipmentCard({ shipment, onView }: { shipment: Shipment; onView?: (shipment: Shipment) => void }) {
  return <button type="button" onClick={() => onView?.(shipment)} className="flex w-full items-start gap-3 px-4 py-4 text-left transition hover:bg-[#FAFCFA]">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EFF4F1] text-[11px] font-black text-[#375B4A]">{shipment.carrier[0]}</div>
    <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between gap-3"><span className="text-xs font-extrabold text-[#17382C]">{shipment.id}</span><span className="text-xs font-extrabold text-[#17382C]">{shipment.amount}</span></div>
      <div className="mt-1 truncate text-[11px] font-bold text-[#34483F]">{shipment.customer} <span className="font-medium text-[#91A098]">· {shipment.destination}</span></div>
      <div className="mt-2 flex items-center justify-between gap-3"><div className="flex min-w-0 flex-wrap items-center gap-1.5"><StatusBadge status={shipment.status} rawStatus={shipment.rawStatus}/><BnplStatusBadge paymentType={shipment.paymentType} bnplStatus={shipment.bnplStatus} paid={shipment.paymentStatus?.toUpperCase() === 'PAID'}/></div><span className="truncate text-[10px] text-[#91A098]">{shipment.date}</span></div>
    </div>
    <span className="mt-2 text-[#9AA8A1]"><Icon name="arrow" size={15}/></span>
  </button>
}
