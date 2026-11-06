import { useState } from 'react'
import { useNavigate } from 'react-router'
import { DEFAULT_TRANSACTION_FILTERS, useWalletBanks, useWalletTransactions, type TransactionFilters, type TransactionType } from '@/api/wallet'
import { useDebounce } from '@/hooks/useDebounce'
import { formatNaira } from '@/lib/format'
import { paths } from '@/routes/paths'

export const TYPE_OPTIONS: readonly { value: TransactionType | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'CREDIT', label: 'Money in' },
  { value: 'DEBIT', label: 'Money out' },
]

/**
 * Wallet history (sink-inventory's Transactions page): search, credit/debit
 * filter, date range and pages of 30, read from GET wallet/{bank_id}/.
 */
export function useTransactionsPage() {
  const navigate = useNavigate()
  const banks = useWalletBanks()
  const [search, setSearch] = useState('')
  const [type, setType] = useState<TransactionType | ''>('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search.trim(), 350)

  // Normalised so the default view reuses the wallet overview's cached request.
  const filters: TransactionFilters = { ...DEFAULT_TRANSACTION_FILTERS, search: debouncedSearch, type, startDate, endDate: endDate && startDate && endDate < startDate ? startDate : endDate, page }
  const query = useWalletTransactions(filters)
  const pages = query.data?.pages ?? 1
  const resetPage = <T,>(setter: (value: T) => void) => (value: T) => { setter(value); setPage(1) }
  const hasFilters = Boolean(search || type || startDate || endDate)

  return {
    banks,
    transactions: query.data?.transactions ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    retry: () => { void query.refetch() },
    totals: query.data ? { inflow: formatNaira(query.data.inflow), outflow: formatNaira(query.data.outflow) } : null,
    search,
    setSearch: resetPage(setSearch),
    type,
    setType: resetPage(setType),
    startDate,
    setStartDate: resetPage(setStartDate),
    endDate,
    setEndDate: resetPage(setEndDate),
    hasFilters,
    clearFilters: () => { setSearch(''); setType(''); setStartDate(''); setEndDate(''); setPage(1) },
    page,
    pages,
    canPrev: page > 1,
    canNext: page < pages,
    prev: () => setPage(current => Math.max(current - 1, 1)),
    next: () => setPage(current => Math.min(current + 1, pages)),
    backToWallet: () => navigate(paths.wallet),
  }
}
