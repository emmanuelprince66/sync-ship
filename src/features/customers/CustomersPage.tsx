import { Button } from '@/components/ui/Button'
import { PageHeader, SearchInput } from '@/components/ui/common'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { SkeletonGroup, StatCardSkeleton } from '@/components/ui/Skeleton'
import { StatCard } from '@/components/ui/StatCard'
import { cn } from '@/lib/cn'
import { EmptyState } from './components/CustomerBits'
import { CustomerFormModal } from './components/CustomerFormModal'
import { CustomersTable } from './components/CustomersTable'
import { DeleteCustomerModal } from './components/DeleteCustomerModal'
import { useCustomersPage } from './hooks/useCustomersPage'

/** Phones: a swipeable row of stat cards (as on Shipping & tracking) instead of four stacked ones. */
const statsRow = 'no-scrollbar -mx-4 mb-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0'
const statSlot = 'min-w-[78%] snap-start sm:min-w-0'

export default function CustomersPage() {
  const page = useCustomersPage()

  const emptyState = page.isError
    ? <EmptyState title="We couldn’t load your customers" note="Check your connection and try again." action={<Button variant="outline" onClick={page.retry}>Try again</Button>}/>
    : page.isFiltered
      ? <EmptyState icon="search" title="No customers match" note="Try another name, phone number or status."/>
      : <EmptyState title="No customers yet" note="Add the people you sell to, so you can see their orders and reuse their details when you ship." action={<Button variant="outline" icon="plus" onClick={page.openAdd}>Add your first customer</Button>}/>

  return <div>
    <PageHeader
      title="Customers"
      subtitle="Everyone you sell to, with their spend, debts and history."
      actions={<Button icon="plus" onClick={page.openAdd} className="w-full sm:w-auto">Add customer</Button>}
    />

    {page.stats
      ? <div className={statsRow}>{page.stats.map(stat => <div key={stat.label} className={statSlot}><StatCard {...stat}/></div>)}</div>
      : page.isLoading && <SkeletonGroup label="Loading customer stats" className={statsRow}>{Array.from({ length: 3 }, (_, index) => <div key={index} className={statSlot}><StatCardSkeleton/></div>)}</SkeletonGroup>}

    <div className="rounded-2xl border border-[#E2EAE5] bg-white">
      <div className="flex flex-col gap-3 border-b border-[#EBF0ED] p-4 sm:flex-row sm:items-center">
        <SearchInput value={page.searchInput} onChange={page.setSearch} placeholder="Search by name, phone or email" className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#DFE7E2] px-3 text-[#7B8B83]" inputClassName="w-full bg-transparent text-xs font-semibold outline-none"/>
        <Select aria-label="Filter by status" options={page.statusOptions} value={page.status} onValueChange={page.setStatus} className="w-full sm:w-[180px]" boxClassName="h-10 text-xs"/>
      </div>
      <div className={cn('transition-opacity', page.isFetching && 'opacity-60')} aria-busy={page.isFetching || undefined}>
        <CustomersTable customers={page.customers} loading={page.isLoading} emptyState={emptyState} onOpen={page.openCustomer} onEdit={page.openEdit} onDelete={page.askDelete}/>
      </div>
      {!page.isLoading && page.customers.length > 0 && <Pagination currentPage={page.pagination.page} totalPages={page.pagination.pages} onPageChange={page.pagination.setPage} pageSize={page.pagination.pageSize} onPageSizeChange={page.pagination.setPageSize}/>}
    </div>

    <CustomerFormModal open={page.dialog !== null} customer={page.dialog?.mode === 'edit' ? page.dialog.customer : null} onClose={page.closeDialog}/>
    <DeleteCustomerModal customer={page.toDelete} deleting={page.isDeleting} onCancel={page.cancelDelete} onConfirm={page.confirmDelete}/>
  </div>
}
