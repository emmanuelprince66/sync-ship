import type { Shipment } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Drawer, ModalTitle } from '@/components/ui/Modal'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { useOrderDetails } from '../hooks/useShipmentDrawer'
import { PaymentCard } from './PaymentCard'
import { BnplStatusBadge } from '@/features/bnpl'
import { StatusBadge } from './StatusBadge'

type OrderDrawerProps = {
  shipment: Shipment | null
  onClose: () => void
  onDownloadReceipt: () => void
  onTrack: () => void
}

const SECTION = 'rounded-2xl border border-[#E1E9E4] p-5'

export function OrderDrawer({ shipment, onClose, onDownloadReceipt, onTrack }: OrderDrawerProps) {
  return <Drawer open={Boolean(shipment)} onClose={onClose}>
    {shipment && <OrderDetails shipment={shipment} onClose={onClose} onDownloadReceipt={onDownloadReceipt} onTrack={onTrack}/>}
  </Drawer>
}

function OrderDetails({ shipment, onClose, onDownloadReceipt, onTrack }: OrderDrawerProps & { shipment: Shipment }) {
  const order = useOrderDetails(shipment)
  return <>
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E4EBE7] bg-white px-5 py-5 sm:px-6"><div><ModalTitle className="text-base font-black text-[#17382C]">Order details</ModalTitle><div className="mt-0.5 text-[10px] font-bold text-[#87968F]">{shipment.id}</div></div><button type="button" aria-label="Close" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E0E8E3] text-[#667870]"><Icon name="close" size={17}/></button></div>
    <div className="space-y-5 p-5 sm:p-6">
      <div className="rounded-2xl bg-[#F3F8F4] p-5"><div className="flex items-center justify-between gap-3"><div className="flex min-w-0 flex-wrap items-center gap-1.5"><StatusBadge status={shipment.status} rawStatus={shipment.rawStatus}/><BnplStatusBadge paymentType={shipment.paymentType} bnplStatus={shipment.bnplStatus} paid={shipment.paymentStatus?.toUpperCase() === 'PAID'}/></div><span className="text-lg font-black text-[#17382C]">{shipment.amount}</span></div><div className="mt-5 flex items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-black text-[#438352]">{shipment.carrier[0]}</div><div className="min-w-0"><div className="truncate text-xs font-extrabold text-[#28483B]">{shipment.carrier}</div><div className="mt-1 text-[10px] text-[#84948C]">Booked {shipment.date}</div></div></div></div>

      {order.loading ? <CardSkeleton className={SECTION} lines={4}/> : <div className={SECTION}>
        <div className="mb-5 flex items-center justify-between gap-3"><div className="text-xs font-extrabold text-[#17382C]">Delivery progress</div><button type="button" onClick={order.refreshTracking} disabled={order.refreshing} className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-extrabold text-[#438352] hover:bg-[#EAF5E9] disabled:opacity-45"><span className={cn(order.refreshing && 'animate-spin')}><Icon name="route" size={13}/></span>{order.refreshing ? 'Refreshing…' : 'Refresh tracking'}</button></div>
        <div className="space-y-0">{order.stages.map((stage, index) => <div key={stage.label} className="relative flex gap-3 pb-6 last:pb-0">{index < order.stages.length - 1 && <span className={cn('absolute left-[11px] top-6 h-full w-[2px]', index + 1 < order.progress ? 'bg-[#529661]' : 'bg-[#DFE7E2]')}/>}<div className={cn('relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2', index < order.progress ? 'border-[#529661] bg-[#529661] text-white' : 'border-[#D7E1DB] bg-white text-[#9AA8A1]')}>{index < order.progress ? <Icon name="check" size={11} stroke={3}/> : <span className="h-1.5 w-1.5 rounded-full bg-current"/>}</div><div className="flex-1"><div className="flex justify-between gap-3"><span className={cn('text-xs font-extrabold', index < order.progress ? 'text-[#28483B]' : 'text-[#88968F]')}>{stage.label}</span><span className="text-[9px] font-semibold text-[#96A39D]">{stage.time}</span></div><div className="mt-1 text-[10px] leading-4 text-[#829189]">{stage.detail}</div></div></div>)}</div>
      </div>}

      {order.loading ? <CardSkeleton className={SECTION} lines={2}/> : <div className={SECTION}><div className="mb-4 text-xs font-extrabold text-[#17382C]">Customer & destination</div><div className="flex gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF5E9] text-[#438352]"><Icon name="user" size={17}/></div><div className="min-w-0"><div className="text-xs font-extrabold text-[#34483F]">{shipment.customer}</div><div className="mt-1 break-words text-[10px] leading-4 text-[#829189]">{order.address}{order.phone && <><br/>{order.phone}</>}{order.email && <><br/>{order.email}</>}</div></div></div></div>}

      {order.loading ? <CardSkeleton className={SECTION} lines={2}/> : <div className={SECTION}><div className="mb-4 text-xs font-extrabold text-[#17382C]">Package</div>{order.packageLines.length === 0 ? <div className="text-[10px] text-[#8A9992]">No package details for this order.</div> : order.packageLines.map(line => <div key={line.key} className="flex items-center justify-between gap-3 border-t border-[#EDF1EF] py-3 first:border-0 first:pt-0 last:pb-0"><div className="min-w-0"><div className="truncate text-xs font-bold text-[#34483F]">{line.name}</div><div className="mt-1 text-[10px] text-[#8A9992]">{line.meta}</div></div><span className="text-xs font-extrabold text-[#28483B]">{line.amount}</span></div>)}</div>}

      {!order.loading && <PaymentCard shipment={shipment}/>}

      <div className="grid grid-cols-2 gap-3"><Button variant="outline" icon="download" onClick={onDownloadReceipt}>Receipt</Button><Button icon="truck" onClick={onTrack}>Track live</Button></div>
    </div>
  </>
}
