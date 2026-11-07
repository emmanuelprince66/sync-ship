import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { useBusinessBanks, useCan, useWalletAccount, type TransactionFilter, type TransactionQuery, type WalletTrx } from '@/api/transactions'
import type { BusinessBank } from '@/api/business'
import { useClipboard } from '@/hooks/useClipboard'
import { useDebounce } from '@/hooks/useDebounce'
import { exportTransactionsCsv } from '../format'
import type { ReceiptDetails } from '../types'

export const TRANSACTION_FILTERS: readonly { value: TransactionFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'CREDIT', label: 'Credit' },
  { value: 'DEBIT', label: 'Debit' },
  { value: 'ONLINE', label: 'Online' },
]

export type WalletModal = 'transfer' | 'fund' | 'report' | 'subAccount' | 'kyc' | null

/** Everything the wallet page (sink-inventory's Transactions screen) shows and does. */
export function useWalletPage() {
  const [params, setParams] = useSearchParams()
  const canInitiateTransfer = useCan('can_initiate_expense_transfer')
  const canManageBankDetails = useCan('manage_bank_details')
  const banks = useBusinessBanks()

  // Filters (sink: search, date range, page, ALL/CREDIT/DEBIT/ONLINE)
  const [searchInput, setSearchInput] = useState('')
  const search = useDebounce(searchInput, 500)
  const [filter, setFilter] = useState<TransactionFilter>('ALL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const query: TransactionQuery = { page, search, filter, startDate, endDate, limit: pageSize }
  const account = useWalletAccount(query)

  // Modals — `?action=fund|transfer` opens one (dashboard buttons link here)
  const [modal, setModal] = useState<WalletModal>(() => {
    const action = params.get('action')
    return action === 'fund' || action === 'transfer' ? action : null
  })
  const [kycDismissed, setKycDismissed] = useState(false)
  const [details, setDetails] = useState<WalletTrx | null>(null)
  const [receipt, setReceipt] = useState<ReceiptDetails | null>(null)
  const { copied, copy } = useClipboard()

  useEffect(() => {
    if (params.has('action')) setParams(current => { current.delete('action'); return current }, { replace: true })
  }, [params, setParams])

  const wallet = account.data?.wallet ?? null
  const selected = banks.selectedBank

  // sink: when the business has no bank list yet, the wallet itself is the only account card.
  const accounts = useMemo<BusinessBank[]>(() => {
    if (banks.banks.length) return banks.banks
    return wallet ? [{ id: 'wallet', bank_name: wallet.bankName, account_name: wallet.accountName, account_number: wallet.accountNumber }] : []
  }, [banks.banks, wallet])

  const accountNumber = selected?.account_number || wallet?.accountNumber || ''
  const closeModal = useCallback(() => setModal(null), [])

  return {
    permissions: { canInitiateTransfer, canManageBankDetails },
    loading: account.isLoading || (account.isFetching && !account.data),
    refreshing: account.isFetching && Boolean(account.data),

    accounts,
    selectedId: selected?.id ?? accounts[0]?.id ?? null,
    selectAccount: (id: string) => { if (banks.canSwitchBanks) { banks.setSelectedBankId(id); setPage(1) } },
    canSwitchBanks: banks.canSwitchBanks,
    accountLabel: (bank: BusinessBank) => (banks.isPrimary(bank) || bank.id === 'wallet' ? 'Current' : bank.account_name || 'Account'),

    banner: {
      accountName: selected?.account_name || wallet?.accountName || 'Main Account',
      kind: !selected || banks.isPrimary(selected) ? 'Current' : 'Sub Account',
      bankName: selected?.bank_name || wallet?.bankName || 'Bank account',
      accountNumber: accountNumber || 'Nil',
      holderName: selected?.account_name || wallet?.accountName || 'Account name',
      balance: wallet?.balance ?? 0,
    },
    inflow: account.data?.inflow ?? 0,
    outflow: account.data?.outflow ?? 0,

    filters: {
      searchInput,
      setSearch: (value: string) => { setSearchInput(value); setPage(1) },
      filter,
      setFilter: (value: TransactionFilter) => { setFilter(value); setPage(1) },
      startDate,
      endDate,
      setStartDate: (value: string) => { setStartDate(value); setPage(1) },
      setEndDate: (value: string) => { setEndDate(value); setPage(1) },
      clearDates: () => { setStartDate(''); setEndDate(''); setPage(1) },
    },
    transactions: account.data?.transactions ?? [],
    pagination: { page, pages: account.data?.pages ?? 1, setPage, pageSize, setPageSize: (size: number) => { setPageSize(size); setPage(1) } },

    needsKyc: banks.needsKyc,
    modal: modal ?? (banks.needsKyc && !kycDismissed ? 'kyc' : null),
    openModal: setModal,
    closeModal: () => { if (modal === null && banks.needsKyc) setKycDismissed(true); closeModal() },

    fund: { copied, copyAccountNumber: () => { if (accountNumber) void copy(accountNumber) }, accountNumber },
    exportReport: () => {
      const rows = account.data?.transactions ?? []
      if (!rows.length) { toast.info('There are no transactions to export for these filters.'); return }
      exportTransactionsCsv(rows)
      setModal(null)
    },

    details,
    openDetails: setDetails,
    closeDetails: () => setDetails(null),
    receipt,
    showReceipt: (value: ReceiptDetails) => { setDetails(null); setReceipt(value) },
    closeReceipt: () => setReceipt(null),
    bankId: banks.selectedBankId,
    businessId: banks.businessId,
    walletAccountName: wallet?.accountName ?? '',
  }
}

export type WalletPageModel = ReturnType<typeof useWalletPage>
