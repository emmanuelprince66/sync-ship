import { cn } from '@/lib/cn'
import type { DateRangeModel } from '@/hooks/useDateRange'
import { Icon } from './Icon'

/** The from/to picker the Wallet, Shipments, Customers and Sales history share, for looking at earlier records. */
export function DateRangeInputs({ range, className }: { range: DateRangeModel; className?: string }) {
  return <div className={cn('flex h-10 items-center gap-1.5 rounded-xl border border-[#DFE7E2] bg-white px-2.5 text-[11px] text-[#53665D]', className)}>
    <Icon name="clock" size={14}/>
    <input type="date" aria-label="From date" value={range.startDate} max={range.endDate || undefined} onChange={event => range.setStartDate(event.target.value)} className="w-[118px] min-w-0 bg-transparent text-[11px] font-semibold outline-none"/>
    <span>–</span>
    <input type="date" aria-label="To date" value={range.endDate} min={range.startDate || undefined} onChange={event => range.setEndDate(event.target.value)} className="w-[118px] min-w-0 bg-transparent text-[11px] font-semibold outline-none"/>
    {range.active && <button type="button" aria-label="Clear dates" onClick={range.clear} className="text-[#91A098] hover:text-[#C2483D]"><Icon name="close" size={13}/></button>}
  </div>
}
