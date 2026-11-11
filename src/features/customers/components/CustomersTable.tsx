import { createColumnHelper } from '@tanstack/react-table'
import { useMemo, type ReactNode } from 'react'
import type { Customer } from '@/api/customers'
import { DataTable } from '@/components/ui/DataTable'
import { Icon } from '@/components/ui/Icon'
import { formatNaira } from '@/lib/format'
import { CustomerAvatar, StatusChip } from './CustomerBits'

const column = createColumnHelper<Customer>()

type Props = {
  customers: Customer[]
  loading: boolean
  emptyState: ReactNode
  onOpen: (customer: Customer) => void
  onEdit: (customer: Customer) => void
  onDelete: (customer: Customer) => void
}

const iconButton = 'relative z-10 flex h-8 w-8 items-center justify-center rounded-lg text-[#7C8D85] transition-colors'

function Actions({ customer, onEdit, onDelete }: Pick<Props, 'onEdit' | 'onDelete'> & { customer: Customer }) {
  return <div className="flex justify-end gap-1">
    <button type="button" aria-label={`Edit ${customer.name}`} onClick={() => onEdit(customer)} className={`${iconButton} hover:bg-[#EEF5F0] hover:text-[#286B43]`}><Icon name="edit" size={15}/></button>
    <button type="button" aria-label={`Delete ${customer.name}`} onClick={() => onDelete(customer)} className={`${iconButton} hover:bg-[#FDECEA] hover:text-[#C2413A]`}><Icon name="trash" size={15}/></button>
  </div>
}

/** Customer list: a table on desktop, cards on phones. The name (or the whole card on phones) opens the profile. */
export function CustomersTable({ customers, loading, emptyState, onOpen, onEdit, onDelete }: Props) {
  const columns = useMemo(() => [
    column.display({
      id: 'customer',
      header: 'Customer',
      cell: ({ row: { original } }) => <div className="flex items-center gap-3">
        <CustomerAvatar name={original.name}/>
        <div className="min-w-0">
          <button type="button" onClick={() => onOpen(original)} className="block max-w-[220px] truncate text-left text-xs font-extrabold text-[#17382C] hover:text-[#438352] hover:underline">{original.name}</button>
          <div className="mt-0.5 max-w-[220px] truncate text-[10px] text-[#899891]">{original.email || original.code || 'No email'}</div>
        </div>
      </div>,
      meta: { headerClassName: 'pl-5', cellClassName: 'pl-5' },
    }),
    column.accessor('phone', { header: 'Phone', cell: info => <span className="text-xs font-bold text-[#53665D]">{info.getValue() || '—'}</span> }),
    column.accessor('ordersCount', { header: 'Orders', cell: info => <span className="text-xs font-bold text-[#53665D]">{info.getValue()}</span> }),
    column.accessor('totalSpent', { header: 'Total spent', cell: info => <span className="text-xs font-extrabold text-[#17382C]">{formatNaira(info.getValue())}</span> }),
    column.display({
      id: 'balance',
      header: 'Wallet / debt',
      cell: ({ row: { original } }) => <div className="text-xs"><div className="font-bold text-[#53665D]">{formatNaira(original.walletBalance)}</div>{original.creditBalance > 0 && <div className="mt-0.5 text-[10px] font-extrabold text-[#C2413A]">Owes {formatNaira(original.creditBalance)}</div>}</div>,
    }),
    column.accessor('status', { header: 'Status', cell: info => <StatusChip value={info.getValue()}/> }),
    column.display({ id: 'actions', header: () => <span className="sr-only">Actions</span>, cell: ({ row: { original } }) => <Actions customer={original} onEdit={onEdit} onDelete={onDelete}/>, meta: { headerClassName: 'pr-5', cellClassName: 'pr-5' } }),
  ], [onOpen, onEdit, onDelete])

  return <DataTable
    columns={columns}
    data={customers}
    loading={loading}
    minWidthClassName="min-w-[860px]"
    getRowId={customer => customer.id}
    emptyState={emptyState}
    renderMobileCard={customer => <div className="relative flex items-start gap-3 px-4 py-4">
      <CustomerAvatar name={customer.name}/>
      <div className="min-w-0 flex-1">
        {/* Stretched over the card, so a tap anywhere outside the actions opens the profile. */}
        <button type="button" onClick={() => onOpen(customer)} className="block max-w-full truncate text-left text-xs font-extrabold text-[#17382C] after:absolute after:inset-0">{customer.name}</button>
        <div className="mt-0.5 truncate text-[11px] text-[#899891]">{customer.phone}{customer.email ? ` · ${customer.email}` : ''}</div>
        <div className="mt-2 flex flex-wrap items-center gap-2"><span className="text-xs font-extrabold text-[#17382C]">{formatNaira(customer.totalSpent)}</span><span className="text-[10px] text-[#91A098]">{customer.ordersCount} order{customer.ordersCount === 1 ? '' : 's'}</span><StatusChip value={customer.status}/></div>
        {customer.creditBalance > 0 && <div className="mt-1 text-[10px] font-extrabold text-[#C2413A]">Owes {formatNaira(customer.creditBalance)}</div>}
      </div>
      <Actions customer={customer} onEdit={onEdit} onDelete={onDelete}/>
    </div>}
  />
}
