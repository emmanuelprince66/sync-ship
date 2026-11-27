import { Button } from '@/components/ui/Button'
import { PageHeader, SearchInput } from '@/components/ui/common'
import { Icon } from '@/components/ui/Icon'
import { SelectField } from '@/components/ui/SelectField'
import { StatCardSkeleton } from '@/components/ui/Skeleton'
import { StatCard } from '@/components/ui/StatCard'
import { OrderDrawer } from './components/OrderDrawer'
import { ShipmentTable } from './components/ShipmentTable'
import { Pagination } from '@/components/ui/Pagination'
import { useShipmentsPage } from './hooks/useShipmentsPage'
import { STATUS_FILTER_OPTIONS, PAYMENT_FILTER_OPTIONS } from './utils'

export default function ShipmentsPage({ tracking = false }: { tracking?: boolean }) {
  const { title, subtitle, isLoading, statCards, statsLoading, filters, payment, setPayment, dates, drawer, statusRef, focusStatusFilter, exportCsv, createShipment, canCreateShipments, pagination } = useShipmentsPage(tracking)
  return <div>
    <PageHeader title={title} subtitle={subtitle} actions={<div className="flex gap-2"><Button variant="outline" icon="download" onClick={exportCsv}>Export CSV</Button>{canCreateShipments && <Button icon="plus" onClick={createShipment}>Create shipment</Button>}</div>}/>
    {/* Phones: swipeable row of stat cards instead of three tall stacked cards. */}
    <div className="no-scrollbar -mx-4 mb-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">{statsLoading
      ? Array.from({ length: 3 }, (_, index) => <div key={index} className="min-w-[78%] snap-start sm:min-w-0"><StatCardSkeleton/></div>)
      : statCards.map(card => <div key={card.label} className="min-w-[78%] snap-start sm:min-w-0"><StatCard {...card}/></div>)}</div>
    <div className="rounded-2xl border border-[#E2EAE5] bg-white">
      <div className="flex flex-wrap items-center gap-3 border-b border-[#EBF0ED] p-4"><SearchInput value={filters.search} onChange={filters.setSearch} placeholder="Search shipment or customer" className="flex h-10 min-w-0 basis-full items-center gap-2 rounded-xl border border-[#DFE7E2] px-3 text-[#7B8B83] sm:min-w-[240px] sm:flex-1 sm:basis-auto" inputClassName="w-full bg-transparent text-xs font-semibold outline-none"/><Button variant="outline" icon="filter" onClick={focusStatusFilter}>Filter</Button><div ref={statusRef}><SelectField label="" boxClassName="h-10 min-w-[150px]" aria-label="Filter by status" value={filters.status} onValueChange={filters.setStatus} options={STATUS_FILTER_OPTIONS}/></div><SelectField label="" boxClassName="h-10 min-w-[140px]" aria-label="Filter by payment method" value={payment} onValueChange={setPayment} options={PAYMENT_FILTER_OPTIONS}/>
        {/* Earlier records: the same from/to picker as the wallet's transactions. */}
        <div className="flex h-10 items-center gap-1.5 rounded-xl border border-[#DFE7E2] px-2.5 text-[11px] text-[#53665D]">
          <Icon name="clock" size={14}/>
          <input type="date" aria-label="From date" value={dates.startDate} max={dates.endDate || undefined} onChange={event => dates.setStartDate(event.target.value)} className="w-[118px] bg-transparent text-[11px] font-semibold outline-none"/>
          <span>–</span>
          <input type="date" aria-label="To date" value={dates.endDate} min={dates.startDate || undefined} onChange={event => dates.setEndDate(event.target.value)} className="w-[118px] bg-transparent text-[11px] font-semibold outline-none"/>
          {(dates.startDate || dates.endDate) && <button type="button" aria-label="Clear dates" onClick={dates.clear} className="text-[#91A098] hover:text-[#C2483D]"><Icon name="close" size={13}/></button>}
        </div></div>
      <ShipmentTable shipments={filters.filtered} loading={isLoading} onView={drawer.open}/>
      <Pagination currentPage={pagination.page} totalPages={pagination.pages} onPageChange={pagination.setPage} pageSize={pagination.pageSize} onPageSizeChange={pagination.setPageSize}/>
    </div>
    <OrderDrawer shipment={drawer.selected} onClose={drawer.close} onDownloadReceipt={drawer.downloadReceipt} onTrack={drawer.trackLive}/>
  </div>
}
