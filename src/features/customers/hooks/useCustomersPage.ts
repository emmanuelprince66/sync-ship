import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { CUSTOMER_STATUS_OPTIONS, CUSTOMERS_PAGE_SIZE, useCustomers, useDeleteCustomer, type Customer, type CustomerStatusFilter } from '@/api/customers'
import type { IconName } from '@/components/ui/Icon'
import { useDebounce } from '@/hooks/useDebounce'
import { formatNaira } from '@/lib/format'
import { customerPath } from '@/routes/paths'

export type CustomerDialog = { mode: 'add' } | { mode: 'edit'; customer: Customer } | null

const STATUS_OPTIONS = CUSTOMER_STATUS_OPTIONS.map(option => ({ value: option.value || 'all', label: option.label }))

/** Customers: server-side search, status filter and pages; add, edit, delete; open a customer's profile. */
export function useCustomersPage() {
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState('')
  const [status, setStatus] = useState<CustomerStatusFilter>('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(CUSTOMERS_PAGE_SIZE)
  const [dialog, setDialog] = useState<CustomerDialog>(null)
  const [toDelete, setToDelete] = useState<Customer | null>(null)
  const debounced = useDebounce(searchInput.trim(), 500)
  // Sink only sends a search from three characters.
  const search = debounced.length >= 3 ? debounced : ''
  const query = useCustomers({ page, limit: pageSize, search, status })
  const remove = useDeleteCustomer()

  const customers = query.data?.customers ?? []
  const summary = query.data?.summary
  const stats: { label: string; value: string; icon: IconName; color: string }[] | null = summary
    ? [
        { label: 'Customers', value: summary.count.toLocaleString(), icon: 'users', color: '#438352' },
        { label: 'Total spend', value: formatNaira(summary.totalSpend), icon: 'chart', color: '#3664E8' },
        { label: 'Outstanding debt', value: formatNaira(summary.totalDebt), icon: 'card', color: '#C2483D' },
      ]
    : null

  return {
    searchInput,
    setSearch: (value: string) => { setSearchInput(value); setPage(1) },
    status: status || 'all',
    statusOptions: STATUS_OPTIONS,
    setStatus: (value: string) => { setStatus((value === 'all' ? '' : value) as CustomerStatusFilter); setPage(1) },
    customers,
    stats,
    isLoading: query.isLoading,
    isFetching: query.isFetching && !query.isLoading,
    isError: query.isError && !query.data,
    retry: () => void query.refetch(),
    isFiltered: Boolean(search || status),
    pagination: { page, pages: query.data?.pages ?? 1, setPage, pageSize, setPageSize: (size: number) => { setPageSize(size); setPage(1) } },
    openCustomer: (customer: Customer) => navigate(customerPath(customer.id)),
    dialog,
    openAdd: () => setDialog({ mode: 'add' }),
    openEdit: (customer: Customer) => setDialog({ mode: 'edit', customer }),
    closeDialog: () => setDialog(null),
    toDelete,
    askDelete: setToDelete,
    cancelDelete: () => setToDelete(null),
    isDeleting: remove.isPending,
    confirmDelete: () => toDelete && remove.mutate(toDelete.id, {
      onSuccess: () => { toast.success(`${toDelete.name} deleted`); setToDelete(null) },
      onError: error => toast.error(errorMessage(error, 'Could not delete this customer.')),
    }),
  }
}

export type CustomersPageModel = ReturnType<typeof useCustomersPage>
