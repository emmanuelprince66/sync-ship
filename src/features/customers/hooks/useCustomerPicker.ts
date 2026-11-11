import { useState } from 'react'
import { useCustomers, type Customer } from '@/api/customers'
import { useDebounce } from '@/hooks/useDebounce'

const PICKER_LIMIT = 10

/** Search state for the saved-customer picker. Only fetches while the picker is open. */
export function useCustomerPicker(open: boolean, onPick: (customer: Customer) => void, onClose: () => void) {
  const [searchInput, setSearchInput] = useState('')
  const debounced = useDebounce(searchInput.trim(), 400)
  // Same rule as the customer list: the backend search starts at three characters.
  const search = debounced.length >= 3 ? debounced : ''
  const query = useCustomers({ page: 1, limit: PICKER_LIMIT, search, enabled: open })
  const customers = query.data?.customers ?? []

  const close = () => { setSearchInput(''); onClose() }

  return {
    searchInput,
    setSearch: setSearchInput,
    customers,
    isLoading: query.isLoading,
    isFetching: query.isFetching && !query.isLoading,
    isError: query.isError && !query.data,
    retry: () => void query.refetch(),
    isFiltered: Boolean(search),
    hasMore: (query.data?.total ?? 0) > customers.length,
    pick: (customer: Customer) => { onPick(customer); close() },
    close,
  }
}
