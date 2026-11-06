import { Button } from '@/components/ui/Button'
import { PageHeader, SearchInput, SegmentedTabs } from '@/components/ui/common'
import { BackLink } from '@/components/ui/misc'
import { ListSkeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { BankSwitcher } from './components/BankSwitcher'
import { TransactionRow } from './components/TransactionRow'
import { TYPE_OPTIONS, useTransactionsPage } from './hooks/useTransactionsPage'

const DATE_INPUT = 'h-10 w-full min-w-0 rounded-xl border border-[#DFE7E2] bg-white px-3 text-xs font-semibold text-[#17382C] outline-none focus:border-[#529661] focus:ring-4 focus:ring-[#529661]/10'

export default function TransactionsPage() {
  const page = useTransactionsPage()

  return <div className="space-y-6">
    <div>
      <BackLink label="Back to wallet" onClick={page.backToWallet}/>
      <PageHeader className="flex flex-wrap items-center justify-between gap-3" title="Transactions" subtitle="Every payment in and out of your wallet." actions={<BankSwitcher options={page.banks.options} selectedId={page.banks.selectedId} onSelect={page.banks.select}/>}/>
    </div>

    {page.totals && <div className="grid grid-cols-2 gap-3">
      <div className="rounded-2xl border border-[#E2EAE5] bg-white p-4"><div className="text-[10px] font-bold uppercase tracking-[.1em] text-[#7B8C83]">Money in</div><div className="mt-2 text-lg font-black text-[#438352]">{page.totals.inflow}</div></div>
      <div className="rounded-2xl border border-[#E2EAE5] bg-white p-4"><div className="text-[10px] font-bold uppercase tracking-[.1em] text-[#7B8C83]">Money out</div><div className="mt-2 text-lg font-black text-[#B9643D]">{page.totals.outflow}</div></div>
    </div>}

    <div className="rounded-2xl border border-[#E2EAE5] bg-white">
      <div className="space-y-3 border-b border-[#EBF0ED] p-4">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput value={page.search} onChange={page.setSearch} placeholder="Search transactions" className="flex h-10 min-w-0 basis-full items-center gap-2 rounded-xl border border-[#DFE7E2] px-3 text-[#7B8B83] sm:min-w-[220px] sm:flex-1 sm:basis-auto" inputClassName="w-full bg-transparent text-xs font-semibold outline-none"/>
          <SegmentedTabs value={page.type} onChange={page.setType} options={TYPE_OPTIONS} className="flex gap-1 rounded-xl bg-[#EAF1EC] p-1" buttonClassName="rounded-lg px-3 py-1.5 text-[11px] font-extrabold transition"/>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
          <label className="block sm:w-44"><span className="mb-1 block text-[10px] font-extrabold text-[#7B8C83]">From</span><input type="date" value={page.startDate} max={page.endDate || undefined} onChange={event => page.setStartDate(event.target.value)} className={DATE_INPUT}/></label>
          <label className="block sm:w-44"><span className="mb-1 block text-[10px] font-extrabold text-[#7B8C83]">To</span><input type="date" value={page.endDate} min={page.startDate || undefined} onChange={event => page.setEndDate(event.target.value)} className={DATE_INPUT}/></label>
          {page.hasFilters && <button type="button" onClick={page.clearFilters} className="col-span-2 justify-self-start text-[11px] font-extrabold text-[#438352] sm:mt-4">Clear filters</button>}
        </div>
      </div>

      <div className={cn('px-5 transition-opacity', page.isFetching && !page.isLoading && 'opacity-60')}>
        {page.isLoading
          ? <ListSkeleton rows={6}/>
          : page.isError
            ? <div className="py-12 text-center text-xs text-[#7D8E85]">We couldn’t load your transactions. <button type="button" onClick={page.retry} className="font-extrabold text-[#438352]">Try again</button></div>
            : page.transactions.length === 0
              ? <div className="py-12 text-center"><div className="text-sm font-extrabold text-[#17382C]">{page.hasFilters ? 'No matching transactions' : 'No transactions yet'}</div><div className="mt-1 text-xs text-[#7D8E85]">{page.hasFilters ? 'Try a different search, type or date range.' : 'Payments in and out of your wallet will show here.'}</div></div>
              : page.transactions.map(transaction => <TransactionRow key={transaction.id} transaction={transaction}/>)}
      </div>

      {page.pages > 1 && <div className="flex items-center justify-between border-t border-[#EBF0ED] px-4 py-3">
        <Button variant="outline" onClick={page.prev} disabled={!page.canPrev} className="px-3 py-2 text-xs">Previous</Button>
        <span className="text-[11px] font-bold text-[#7B8C83]">Page {page.page} of {page.pages}</span>
        <Button variant="outline" onClick={page.next} disabled={!page.canNext} className="px-3 py-2 text-xs">Next</Button>
      </div>}
    </div>
  </div>
}
