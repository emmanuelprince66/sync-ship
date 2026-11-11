import { createColumnHelper } from '@tanstack/react-table'
import type { CustomerTransaction } from '@/api/customers'
import { formatActivityDate } from '@/api/http'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { Icon } from '@/components/ui/Icon'
import { Pagination } from '@/components/ui/Pagination'
import { cn } from '@/lib/cn'
import { formatNaira } from '@/lib/format'
import type { CustomerDetailModel } from '../hooks/useCustomerDetailPage'
import { EmptyState, FilterPills, StatusChip } from './CustomerBits'

const column = createColumnHelper<CustomerTransaction>()

const STATUS_LABELS: Record<string, string> = { SUCCESSFUL: 'Completed', PAID: 'Completed', UNPAID: 'Pending', PENDING: 'Pending', REVERSED: 'Reversed', CANCELLED: 'Failed', FAILED: 'Failed' }
const statusLabel = (status: string) => STATUS_LABELS[status.toUpperCase()] ?? (status ? status.charAt(0) + status.slice(1).toLowerCase() : '')
const titleCase = (value: string) => value.replace(/_/g, ' ').toLowerCase().replace(/^\w/, char => char.toUpperCase())
const signedAmount = (row: CustomerTransaction) => `${row.flow === 'INFLOW' ? '+' : ''}${formatNaira(row.amount)}`

function Title({ row }: { row: CustomerTransaction }) {
  const inflow = row.flow === 'INFLOW'
  return <div className="flex min-w-0 items-center gap-3">
    <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', inflow ? 'bg-[#EAF5E9] text-[#438352]' : 'bg-[#E8F0FC] text-[#426AB2]')}><Icon name={inflow ? 'arrowIn' : 'arrowOut'} size={16}/></span>
    <div className="min-w-0"><div className="truncate text-xs font-extrabold text-[#17382C]">{row.title}</div><div className="mt-0.5 truncate text-[10px] text-[#899891]">{titleCase(row.type)}{row.reference ? ` · ${row.reference}` : ''}</div></div>
  </div>
}

const columns = [
  column.display({ id: 'title', header: 'Transaction', cell: ({ row }) => <Title row={row.original}/>, meta: { headerClassName: 'pl-5', cellClassName: 'pl-5' } }),
  column.accessor('paymentMethod', { header: 'Method', cell: info => <span className="text-xs font-bold text-[#53665D]">{info.getValue() ? titleCase(info.getValue()) : '—'}</span> }),
  column.accessor('createdAt', { header: 'Date', cell: info => <span className="text-xs font-bold text-[#53665D]">{formatActivityDate(info.getValue())}</span> }),
  column.accessor('status', { header: 'Status', cell: info => <StatusChip value={statusLabel(info.getValue())}/> }),
  column.display({ id: 'amount', header: () => <span className="block text-right">Amount</span>, cell: ({ row }) => <span className="block text-right text-xs font-extrabold text-[#17382C]">{signedAmount(row.original)}</span>, meta: { headerClassName: 'pr-5', cellClassName: 'pr-5' } }),
]

/** The customer's history: purchases, wallet movements, debt settlements, loyalty and referral events. */
export function CustomerTransactions({ model }: { model: CustomerDetailModel['transactions'] }) {
  return <section className="overflow-hidden rounded-2xl border border-[#E2EAE5] bg-white">
    <div className="flex flex-col gap-3 border-b border-[#EBF0ED] p-4 sm:px-5">
      <div><div className="text-sm font-extrabold text-[#17382C]">History</div><div className="mt-0.5 text-[10px] text-[#899890]">Purchases, wallet top-ups, debt payments and rewards.</div></div>
      <FilterPills label="Filter history by type" value={model.type} options={model.types} onChange={model.setType}/>
    </div>
    <div className={cn('transition-opacity', model.isFetching && 'opacity-60')}>
      <DataTable
        columns={columns}
        data={model.rows}
        loading={model.isLoading}
        minWidthClassName="min-w-[680px]"
        getRowId={row => row.id}
        emptyState={model.isError
          ? <EmptyState icon="clock" title="We couldn’t load this history" note="Check your connection and try again." action={<Button variant="outline" onClick={model.retry}>Try again</Button>} className="py-4"/>
          : <EmptyState icon="clock" title="No transactions yet" note="Purchases and wallet movements for this customer will show here." className="py-4"/>}
        renderMobileCard={row => <div className="px-4 py-4">
          <div className="flex items-start justify-between gap-3"><div className="min-w-0 flex-1"><Title row={row}/></div><span className="shrink-0 text-xs font-extrabold text-[#17382C]">{signedAmount(row)}</span></div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><span className="text-[10px] text-[#91A098]">{formatActivityDate(row.createdAt)}{row.paymentMethod ? ` · ${titleCase(row.paymentMethod)}` : ''}</span><StatusChip value={statusLabel(row.status)}/></div>
        </div>}
      />
    </div>
    {model.pages > 1 && <Pagination currentPage={model.page} totalPages={model.pages} onPageChange={model.setPage}/>}
  </section>
}
