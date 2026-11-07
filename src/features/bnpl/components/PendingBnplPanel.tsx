import type { PendingBnplOrder } from '@/api/bnpl'
import { Pagination } from '@/components/ui/Pagination'
import { DataTable } from '@/components/ui/DataTable'
import { Icon } from '@/components/ui/Icon'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { formatNaira } from '@/lib/format'
import { usePendingBnplPanel } from '../hooks/usePendingBnplPanel'
import { BnplStageBadge } from './BnplBadges'
import { formatBnplDay, pendingBnplColumns } from './pendingBnplColumns'

/** Phone layout for one settlement. */
function SettlementCard({ order }: { order: PendingBnplOrder }) {
  return <div className="px-4 py-4">
    <div className="flex items-center justify-between gap-3"><span className="text-xs font-extrabold text-[#438352]">{order.orderReference}</span><span className="text-xs font-black text-[#17382C]">{formatNaira(order.netSettlementAmount)}</span></div>
    <div className="mt-1 truncate text-[11px] font-bold text-[#34483F]">{order.customer?.name ?? 'Walk-in customer'} <span className="font-medium text-[#91A098]">· {formatBnplDay(order.orderDate)}</span></div>
    <div className="mt-2 flex items-center justify-between gap-3"><BnplStageBadge stage={order.stage} label={order.stageLabel} description={order.stageDescription}/><span className="text-[10px] text-[#91A098]">{formatNaira(order.orderAmount)} − <span className="text-[#C2483D]">{formatNaira(order.feeDeducted)}</span></span></div>
  </div>
}

/**
 * Akawopay settlements on their way to the wallet (sink's PendingBnplPanel).
 * Kept apart from the transaction list on purpose: none of it is in the balance yet.
 */
type PendingBnplPanelProps = {
  /** Same date range as the wallet transactions (sink passes the page's DateRange). */
  dateRange?: { from?: Date; to?: Date }
  /** @deprecated ISO yyyy-mm-dd alternative to `dateRange`, kept for the current transactions page mount. */
  startDate?: string
  /** @deprecated See `startDate`. */
  endDate?: string
}

export function PendingBnplPanel({ dateRange, startDate, endDate }: PendingBnplPanelProps) {
  const panel = usePendingBnplPanel({ dateRange, startDate, endDate })

  return <section className="overflow-hidden rounded-2xl border border-[#E2EAE5] bg-white">
    <button type="button" onClick={panel.toggleExpanded} aria-expanded={panel.expanded} className="flex w-full items-center gap-3 p-4 text-left sm:p-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF5E9] text-[#438352]"><Icon name="card" size={19}/></span>
      <span className="min-w-0 flex-1"><span className="block text-sm font-extrabold text-[#17382C]">Buy Now Pay Later</span><span className="mt-0.5 block text-[11px] text-[#7C8D85]">Akawopay settlements on their way to your wallet</span></span>
      {panel.headline && <span className="hidden text-right sm:block"><span className="block text-sm font-black text-[#17382C]">{panel.headline.owed}</span><span className="block text-[10px] text-[#91A098]">{panel.headline.pending}</span></span>}
      <span className={cn('text-[#9AA8A1] transition-transform', panel.expanded && 'rotate-180')}><Icon name="chevron" size={18}/></span>
    </button>

    {panel.expanded && <>
      <div className="grid grid-cols-2 border-y border-[#EBF0ED] lg:grid-cols-4">
        {panel.tiles.map(tile => <div key={tile.label} className="border-[#EBF0ED] p-4 odd:border-r lg:border-r lg:last:border-r-0 sm:p-5">
          <div className="text-[9px] font-extrabold uppercase tracking-[.1em] text-[#8B9992]">{tile.label}</div>
          {panel.isLoading ? <Skeleton className="mt-2 h-6 w-20"/> : <div className={cn('mt-2 text-lg font-black text-[#17382C] sm:text-xl', tile.tone === 'positive' && 'text-[#3C7F4C]', tile.tone === 'negative' && 'text-[#C2483D]')}>{tile.value}</div>}
          <div className="mt-1 text-[10px] text-[#91A098]">{tile.hint}</div>
        </div>)}
      </div>

      <div className="flex flex-col gap-3 border-b border-[#EBF0ED] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          {panel.tabs.map(tab => <button key={tab.key} type="button" onClick={() => panel.setStage(tab.key)} className={cn('shrink-0 rounded-full border px-3.5 py-1.5 text-[11px] font-extrabold transition-colors', panel.stage === tab.key ? 'border-[#286B43] bg-[#286B43] text-white' : 'border-[#E0E8E3] text-[#53665D] hover:bg-[#F1F7F2]')}>
            {tab.label}{tab.count !== undefined ? ` (${tab.count})` : ''}
          </button>)}
        </div>
        <button type="button" onClick={panel.goToSettings} className="shrink-0 self-start text-[11px] font-extrabold text-[#438352] hover:underline sm:self-auto">BNPL settings</button>
      </div>

      {panel.isError
        ? <div className="p-8 text-center"><p className="text-xs font-extrabold text-[#34483F]">Could not load pending BNPL settlements</p><p className="mt-1 text-[11px] text-[#7D8E85]">Try again in a moment. Anything already settled still shows under Transactions.</p><button type="button" onClick={panel.retry} className="mt-3 text-[11px] font-extrabold text-[#438352]">Try again</button></div>
        : <div className={cn('transition-opacity', panel.isFetching && !panel.isLoading && 'opacity-60')}>
          <DataTable columns={pendingBnplColumns} data={panel.orders} loading={panel.isLoading} minWidthClassName="min-w-[760px]" emptyState="Nothing waiting to be settled" getRowId={order => order.saleId || order.orderReference} renderMobileCard={order => <SettlementCard order={order}/>}/>
        </div>}

      {panel.pages > 1 && <Pagination currentPage={panel.page} totalPages={panel.pages} onPageChange={panel.setPage}/>}
    </>}
  </section>
}
