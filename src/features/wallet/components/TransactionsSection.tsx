import { createColumnHelper } from '@tanstack/react-table'
import type { WalletTrx } from '@/api/transactions'
import { SearchInput } from '@/components/ui/common'
import { DataTable } from '@/components/ui/DataTable'
import { Pagination } from '@/components/ui/Pagination'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'
import { formatBalance, formatTrxDate } from '../format'
import { TRANSACTION_FILTERS, type WalletPageModel } from '../hooks/useWalletPage'

const pill = (tone: 'green' | 'red' | 'amber' | 'grey') => cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-extrabold', {
  green: 'bg-[#E8F5E8] text-[#3C7F4C]', red: 'bg-[#FDECEA] text-[#C2483D]', amber: 'bg-[#FFF4D9] text-[#A16A15]', grey: 'bg-[#EEF3F0] text-[#53665D]',
}[tone])

const statusTone = (status: string) => (status === 'SUCCESS' ? 'green' : status === 'PENDING' ? 'amber' : 'red')

const column = createColumnHelper<WalletTrx>()

/** sink's TransactionColunm: ID, customer, type, channel, BNPL, amount, account, date, status, action. */
const buildColumns = (onView: (trx: WalletTrx) => void) => [
  column.accessor('id', { header: 'Transaction ID', meta: { headerClassName: 'px-5', cellClassName: 'px-5' }, cell: ({ getValue }) => <span className="text-xs font-extrabold text-[#438352]">{getValue().slice(0, 10)}</span> }),
  column.accessor('accountName', { header: 'Customer', cell: ({ getValue }) => <span className="text-xs font-semibold text-[#34483F]">{getValue() || '—'}</span> }),
  column.accessor('type', { header: 'Type', cell: ({ getValue }) => <span className={pill(getValue() === 'CREDIT' ? 'green' : 'red')}>{getValue()}</span> }),
  column.accessor('channel', { header: 'Channel', cell: ({ getValue }) => <span className={pill('grey')}>{getValue()}</span> }),
  column.accessor('isBnpl', { header: 'BNPL', cell: ({ row: { original } }) => original.isBnpl ? <div><span className="text-xs font-extrabold text-[#34483F]">Yes</span>{original.bnplReference && <p className="text-[10px] text-[#438352]">{original.bnplReference}</p>}</div> : <span className="text-xs text-[#91A098]">No</span> }),
  column.accessor('amount', { header: 'Amount', cell: ({ getValue }) => <span className="text-xs font-extrabold text-[#17382C]">{formatBalance(getValue())}</span> }),
  column.accessor('accountNumber', { header: 'Account number', cell: ({ getValue }) => <span className="text-xs text-[#829189]">{getValue() || '—'}</span> }),
  column.accessor('createdAt', { header: 'Date', cell: ({ getValue }) => <span className="text-xs text-[#829189]">{formatTrxDate(getValue())}</span> }),
  column.accessor('status', { header: 'Status', cell: ({ getValue }) => <span className={pill(statusTone(getValue()))}>{getValue()}</span> }),
  column.display({ id: 'actions', header: () => <span className="sr-only">Action</span>, cell: ({ row: { original } }) => <button type="button" onClick={() => onView(original)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-extrabold text-[#438352] hover:bg-[#EAF5E9]">View more <Icon name="arrow" size={13}/></button> }),
]

function TransactionCard({ trx, onView }: { trx: WalletTrx; onView: (trx: WalletTrx) => void }) {
  const credit = trx.type === 'CREDIT'
  return <button type="button" onClick={() => onView(trx)} className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-[#FAFCFA]">
    <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', credit ? 'bg-[#EAF5E9] text-[#438352]' : 'bg-[#FDECEA] text-[#C2483D]')}><Icon name={credit ? 'arrowIn' : 'arrowOut'} size={15}/></span>
    <span className="min-w-0 flex-1">
      <span className="flex items-center justify-between gap-3"><span className="truncate text-xs font-extrabold text-[#17382C]">{trx.accountName || trx.description || trx.id.slice(0, 10)}</span><span className={cn('shrink-0 text-xs font-extrabold', credit ? 'text-[#438352]' : 'text-[#C2483D]')}>{credit ? '+' : '-'}{formatBalance(trx.amount)}</span></span>
      <span className="mt-1.5 flex items-center justify-between gap-3"><span className="truncate text-[10px] text-[#91A098]">{formatTrxDate(trx.createdAt)} · {trx.channel}{trx.isBnpl ? ' · BNPL' : ''}</span><span className={pill(statusTone(trx.status))}>{trx.status}</span></span>
    </span>
  </button>
}

/** "Transactions" section: search, filter chips, date range, table and pages (sink layout). */
export function TransactionsSection({ page }: { page: WalletPageModel }) {
  const { filters, pagination } = page
  return <section className="overflow-hidden rounded-2xl border border-[#E2EAE5] bg-white">
    <div className="flex items-center gap-3 border-b border-[#EBF0ED] px-5 py-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF5E9] text-[#438352]"><Icon name="wallet" size={17}/></span>
      <div><div className="text-sm font-extrabold text-[#17382C]">Transactions</div><div className="text-[10px] text-[#899890]">Money in and out of the selected account</div></div>
      {page.refreshing && <span className="ml-auto h-4 w-4 animate-spin rounded-full border-2 border-[#529661] border-t-transparent" aria-label="Updating"/>}
    </div>
    <div className="flex flex-col gap-3 border-b border-[#EBF0ED] p-4 lg:flex-row lg:items-center lg:justify-between">
      <SearchInput value={filters.searchInput} onChange={filters.setSearch} placeholder="Search transactions..." className="flex h-10 w-full items-center gap-2 rounded-xl border border-[#DFE7E2] px-3 text-[#7B8B83] lg:w-72" inputClassName="w-full bg-transparent text-xs font-semibold outline-none"/>
      <div className="flex flex-wrap items-center gap-2">
        {TRANSACTION_FILTERS.map(option => <button key={option.value} type="button" onClick={() => filters.setFilter(option.value)} aria-pressed={filters.filter === option.value}
          className={cn('rounded-full border px-4 py-1.5 text-xs font-extrabold transition-colors', filters.filter === option.value ? 'border-[#286B43] bg-[#286B43] text-white' : 'border-[#DFE7E2] text-[#53665D] hover:bg-[#F3F7F4]')}>{option.label}</button>)}
        <div className="flex items-center gap-1.5 rounded-xl border border-[#DFE7E2] px-2.5 py-1.5 text-[11px] text-[#53665D]">
          <Icon name="clock" size={14}/>
          <input type="date" aria-label="From date" value={filters.startDate} max={filters.endDate || undefined} onChange={event => filters.setStartDate(event.target.value)} className="w-[118px] bg-transparent text-[11px] font-semibold outline-none"/>
          <span>–</span>
          <input type="date" aria-label="To date" value={filters.endDate} min={filters.startDate || undefined} onChange={event => filters.setEndDate(event.target.value)} className="w-[118px] bg-transparent text-[11px] font-semibold outline-none"/>
          {(filters.startDate || filters.endDate) && <button type="button" aria-label="Clear dates" onClick={filters.clearDates} className="text-[#91A098] hover:text-[#C2483D]"><Icon name="close" size={13}/></button>}
        </div>
      </div>
    </div>
    <DataTable columns={buildColumns(page.openDetails)} data={page.transactions} loading={page.loading} minWidthClassName="min-w-[1080px]" getRowId={trx => trx.id}
      emptyState={<div className="py-4"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF5E9] text-[#438352]"><Icon name="wallet" size={22}/></div><div className="mt-3 text-sm font-extrabold text-[#17382C]">No transactions yet</div><div className="mt-1 text-[11px] font-medium text-[#829189]">Money in and out of this account will show here.</div></div>}
      renderMobileCard={trx => <TransactionCard trx={trx} onView={page.openDetails}/>}/>
    {(pagination.pages > 1 || page.transactions.length > 0) && <Pagination currentPage={pagination.page} totalPages={pagination.pages} onPageChange={pagination.setPage} pageSize={pagination.pageSize} onPageSizeChange={pagination.setPageSize}/>}
  </section>
}
