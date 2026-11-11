import type { Customer } from '@/api/customers'
import { Button } from '@/components/ui/Button'
import { SearchInput } from '@/components/ui/common'
import { Icon } from '@/components/ui/Icon'
import { Modal, ModalHeader } from '@/components/ui/Modal'
import { ListSkeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { useCustomerPicker } from '../hooks/useCustomerPicker'
import { CustomerAvatar, EmptyState } from './CustomerBits'

type Props = { open: boolean; onClose: () => void; onPick: (customer: Customer) => void }

/** "Pick a saved customer": search the customer list and hand back the chosen record. */
export function CustomerPickerModal({ open, onClose, onPick }: Props) {
  const picker = useCustomerPicker(open, onPick, onClose)

  return <Modal open={open} onClose={picker.close} overlayClassName="bg-[#09261C]/40 p-0 backdrop-blur-[2px] sm:p-4" panelClassName="flex h-[100dvh] w-full flex-col bg-white shadow-[0_25px_80px_rgba(9,38,28,.2)] sm:h-auto sm:max-h-[min(640px,calc(100dvh-2rem))] sm:max-w-md sm:rounded-3xl">
    <ModalHeader title="Pick a saved customer" description="Their name, phone, email and address fill the form." onClose={picker.close} className="shrink-0 px-5 pt-5 sm:px-6"/>
    <div className="shrink-0 px-5 pb-3 pt-4 sm:px-6">
      <SearchInput value={picker.searchInput} onChange={picker.setSearch} placeholder="Search by name, phone or email" className="flex h-11 items-center gap-2 rounded-xl border border-[#DFE7E2] px-3 text-[#7B8B83] focus-within:border-[#529661]" inputClassName="w-full bg-transparent text-sm font-semibold text-[#09261C] outline-none"/>
    </div>
    <div className={cn('min-h-0 flex-1 overflow-y-auto border-t border-[#EDF1EF] px-3 py-2 transition-opacity sm:min-h-[240px]', picker.isFetching && 'opacity-60')}>
      {picker.isLoading
        ? <ListSkeleton rows={5} rowClassName="flex items-center gap-4 px-2 py-3"/>
        : picker.isError
          ? <EmptyState title="We couldn’t load your customers" note="Check your connection and try again." action={<Button variant="outline" onClick={picker.retry}>Try again</Button>}/>
          : picker.customers.length === 0
            ? <EmptyState icon={picker.isFiltered ? 'search' : 'users'} title={picker.isFiltered ? 'No customers match' : 'No saved customers yet'} note={picker.isFiltered ? 'Try another name or number.' : 'Customers you add under Customers show here.'}/>
            : <ul className="flex flex-col gap-0.5">
              {picker.customers.map(customer => <li key={customer.id}>
                <button type="button" onClick={() => picker.pick(customer)} className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-[#F3F7F4] focus-visible:bg-[#F3F7F4] focus-visible:outline-none">
                  <CustomerAvatar name={customer.name}/>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-extrabold text-[#17382C]">{customer.name}</span>
                    <span className="mt-0.5 block truncate text-[10px] text-[#899891]">{[customer.phone, customer.address ? [customer.address.city, customer.address.state].filter(Boolean).join(', ') : ''].filter(Boolean).join(' · ')}</span>
                  </span>
                  <span className="text-[#9AA8A1]"><Icon name="arrow" size={15}/></span>
                </button>
              </li>)}
              {picker.hasMore && <li className="px-2 py-3 text-center text-[10px] font-semibold text-[#899891]">Showing the first {picker.customers.length}. Search to find others.</li>}
            </ul>}
    </div>
  </Modal>
}
