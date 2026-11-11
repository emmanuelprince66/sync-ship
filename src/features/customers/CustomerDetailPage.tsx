import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { BackLink } from '@/components/ui/misc'
import { CardSkeleton, Skeleton, SkeletonGroup, StatCardSkeleton } from '@/components/ui/Skeleton'
import { StatCard } from '@/components/ui/StatCard'
import { CustomerAvatar, EmptyState, StatusChip } from './components/CustomerBits'
import { CustomerFormModal } from './components/CustomerFormModal'
import { CustomerTransactions } from './components/CustomerTransactions'
import { DeleteCustomerModal } from './components/DeleteCustomerModal'
import { useCustomerDetailPage } from './hooks/useCustomerDetailPage'

/** Phones: a swipeable row of stat cards, as on the customer list. */
const statsGrid = 'no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 xl:grid-cols-4'
const statSlot = 'min-w-[78%] snap-start sm:min-w-0'
const layoutGrid = 'grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[320px_minmax(0,1fr)] xl:items-start'

function DetailSkeleton() {
  return <SkeletonGroup label="Loading customer" className="flex flex-col gap-5">
    <div className="flex items-center gap-4"><Skeleton className="h-14 w-14 rounded-full"/><div className="flex-1 space-y-2"><Skeleton className="h-6 w-48 max-w-full"/><Skeleton className="h-3 w-32"/></div></div>
    <div className={statsGrid}>{Array.from({ length: 4 }, (_, index) => <div key={index} className={statSlot}><StatCardSkeleton/></div>)}</div>
    <div className={layoutGrid}><CardSkeleton lines={6}/><CardSkeleton lines={5}/></div>
  </SkeletonGroup>
}

/** A customer's profile: contact details, notes, spend and balances, and their transaction history. */
export default function CustomerDetailPage() {
  const page = useCustomerDetailPage()
  const customer = page.customer

  return <div>
    <BackLink label="Back to customers" onClick={page.goBack}/>

    {page.isLoading ? <DetailSkeleton/> : page.isError || !customer
      ? <div className="rounded-2xl border border-[#E2EAE5] bg-white"><EmptyState title="We couldn’t load this customer" note="They may have been deleted, or the connection dropped." action={<div className="flex flex-wrap justify-center gap-2"><Button variant="outline" onClick={page.goBack}>Back to customers</Button><Button onClick={page.retry}>Try again</Button></div>}/></div>
      : <div className="flex flex-col gap-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex min-w-0 items-center gap-4">
            <CustomerAvatar name={customer.name} className="h-14 w-14 text-sm"/>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><div className="truncate text-xl font-black text-[#09261C]">{customer.name}</div><StatusChip value={customer.status}/></div>
              <div className="mt-1 truncate text-xs text-[#7C8D85]">{page.subtitle}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button variant="outline" icon="trash" onClick={page.confirmDelete.open}>Delete</Button>
            <Button icon="edit" onClick={page.edit.open}>Edit</Button>
          </div>
        </div>

        <div className={statsGrid}>{page.stats.map(stat => <div key={stat.label} className={statSlot}><StatCard {...stat}/></div>)}</div>

        <div className={layoutGrid}>
          <div className="flex flex-col gap-5">
            <section className="rounded-2xl border border-[#E2EAE5] bg-white p-5">
              <div className="text-sm font-extrabold text-[#17382C]">Customer details</div>
              <dl className="mt-2 divide-y divide-[#EDF1EF]">
                {page.details.map(([label, value]) => <div key={label} className="py-3"><dt className="text-[10px] font-semibold text-[#899891]">{label}</dt><dd className="mt-1 text-xs font-extrabold text-[#17382C] [overflow-wrap:anywhere]">{value}</dd></div>)}
              </dl>
            </section>
            <section className="rounded-2xl border border-[#E2EAE5] bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-extrabold text-[#17382C]"><Icon name="note" size={17}/>Notes</div>
                <button type="button" onClick={page.edit.open} className="text-xs font-extrabold text-[#438352]">{page.notes ? 'Edit' : 'Add'}</button>
              </div>
              {page.notes
                ? <p className="mt-3 whitespace-pre-line text-xs font-medium leading-5 text-[#34483F] [overflow-wrap:anywhere]">{page.notes}</p>
                : <p className="mt-3 text-xs leading-5 text-[#899891]">No notes yet. Add delivery preferences or anything worth remembering.</p>}
            </section>
          </div>
          <CustomerTransactions model={page.transactions}/>
        </div>

        <CustomerFormModal open={page.edit.isOpen} customer={customer} onClose={page.edit.close}/>
        <DeleteCustomerModal customer={page.confirmDelete.isOpen ? customer : null} deleting={page.isDeleting} onCancel={page.confirmDelete.close} onConfirm={page.deleteCustomer}/>
      </div>}
  </div>
}
