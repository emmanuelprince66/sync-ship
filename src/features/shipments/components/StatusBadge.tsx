import type { ShipmentStatus } from '@/api/types'
import { cn } from '@/lib/cn'
import { isCancelled } from '../utils'

type Tone = ShipmentStatus | 'Cancelled'

const styles: Record<Tone, string> = {
  'Delivered': 'bg-[#E8F5E8] text-[#3C7F4C]',
  'In transit': 'bg-[#E8F0FC] text-[#426AB2]',
  'Awaiting pickup': 'bg-[#FFF4D9] text-[#A16A15]',
  'Pending payment': 'bg-[#F2ECFA] text-[#7852A0]',
  'Cancelled': 'bg-[#FDECEA] text-[#C2413A]',
}

/** Pass `rawStatus` (backend shipping_status) so cancelled orders show a Cancelled badge. */
export function StatusBadge({ status, rawStatus }: { status: ShipmentStatus; rawStatus?: string }) {
  const tone: Tone = isCancelled(rawStatus) ? 'Cancelled' : status
  return <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold', styles[tone])}><span className="h-1.5 w-1.5 rounded-full bg-current"/>{tone}</span>
}
