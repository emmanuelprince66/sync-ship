import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest, mockDelay } from '@/lib/api-client'
import { queryClient } from '@/lib/query-client'
import { fetchBankList, fetchSettlementAccounts, type SettlementAccount } from './banks'
import { useSelectedBankStore } from '@/stores/selected-bank-store'
import { fetchCurrentBusiness, useCurrentBusiness, useCurrentBusinessId, type Business, type BusinessBank } from './business'
import { asRecord, at, formatShortDate, isLive, listFrom, num, str } from './http'
import { db } from './mock-data'
import { queryKeys } from './query-keys'
import type { BankAccount, Wallet, WalletTransaction } from './types'

/**
 * Wallet, same endpoints as sink-inventory. The wallet is keyed on the
 * business's primary bank (business.banks[is_sub !== true]):
 *  GET  wallet/{bank_id}/?search&type&start_date&end_date&page&limit=30
 *       → { results: { wallet_details, transactions, inflow, outflow }, pages }
 *  POST wallet/beneficiary_enquiry/        { bank_code, account_number } → { data: { ref, name } }
 *  POST wallet/transfer/{bank_id}/         { pin, ref, amount, narration }
 * Withdrawals go to the first settlement account (business/bank/{business_id}/).
 */

export const MIN_WITHDRAWAL = 1000

/** Same fee table sink-inventory shows before a transfer. */
export const transferCharge = (amount: number) => (amount <= 0 ? 0 : amount <= 5000 ? 10 : amount <= 50000 ? 25 : 50)
/** Stamp duty only applies to transfers above ₦10,000. */
export const stampDuty = (amount: number) => (amount > 10000 ? 50 : 0)

const mapTransaction = (value: unknown, index: number): WalletTransaction => {
  const trx = asRecord(value)
  const credit = str(trx.type).toUpperCase() === 'CREDIT'
  const label = str(trx.description) || str(trx.narration) || str(trx.account_name) || (credit ? 'Wallet credit' : 'Wallet debit')
  const isBnpl = trx.is_bnpl === true
  return { id: str(trx.id) || `trx-${index}`, label, date: formatShortDate(str(trx.created_at)), amount: num(trx.amount), kind: credit ? 'credit' : 'debit', icon: credit ? 'wallet' : 'bank', isBnpl, bnplReference: isBnpl ? str(asRecord(trx.bnpl_details).order_reference) || undefined : undefined }
}

const toWithdrawalAccount = (account: SettlementAccount | undefined): BankAccount | null =>
  account
    ? {
        bank: account.bankName,
        accountNumber: account.accountNumber,
        maskedNumber: account.accountNumber.length >= 6 ? `${account.accountNumber.slice(0, 4)}••••${account.accountNumber.slice(-2)}` : account.accountNumber,
        accountName: account.accountName,
        verified: Boolean(account.accountName),
      }
    : null

/** The primary (non sub-account) bank, which sink-inventory defaults the wallet to. */
export const primaryBank = (banks: BusinessBank[]) => banks.find(account => !account.is_sub) ?? banks[0]

const pickBank = (business: Business, selectedBankId: string | null) =>
  business.banks.find(bank => bank.id === selectedBankId) ?? primaryBank(business.banks)

export type TransactionType = 'CREDIT' | 'DEBIT'
export type TransactionFilters = { search: string; type: TransactionType | ''; startDate: string; endDate: string; page: number }
export const TRANSACTIONS_PAGE_SIZE = 30
export const DEFAULT_TRANSACTION_FILTERS: TransactionFilters = { search: '', type: '', startDate: '', endDate: '', page: 1 }

/**
 * One cached GET wallet/{bank_id}/ per bank + filter set. The wallet overview
 * (balance + recent) and the history page's first page use the same default
 * filters, so they share a single request.
 */
export const fetchWalletPage = (bankId: string, filters: TransactionFilters = DEFAULT_TRANSACTION_FILTERS) =>
  queryClient.fetchQuery({
    queryKey: [...queryKeys.wallet, 'page', bankId, filters] as const,
    staleTime: 60 * 1000,
    queryFn: () => {
      const params = new URLSearchParams()
      if (filters.search) params.set('search', filters.search)
      if (filters.type) params.set('type', filters.type)
      if (filters.startDate) params.set('start_date', filters.startDate)
      if (filters.endDate) params.set('end_date', filters.endDate)
      params.set('page', String(filters.page))
      params.set('limit', String(TRANSACTIONS_PAGE_SIZE))
      return apiRequest<unknown>(`wallet/${bankId}/?${params.toString()}`)
    },
  })

const getLiveWallet = async (businessId: string, selectedBankId: string | null): Promise<Wallet> => {
  const [business, accounts] = await Promise.all([fetchCurrentBusiness(), fetchSettlementAccounts(businessId).catch(() => [] as SettlementAccount[])])
  const bank = pickBank(business, selectedBankId)
  const withdrawalAccount = toWithdrawalAccount(accounts[0])
  if (!bank) return { balance: 0, transactions: [], withdrawalAccount, walletBankId: null, virtualAccount: { number: '', name: business.name, bank: '' } }

  const response = await fetchWalletPage(bank.id, DEFAULT_TRANSACTION_FILTERS)
  const details = asRecord(at(response, 'results.wallet_details'))
  return {
    balance: num(details.balance),
    virtualAccount: {
      number: str(details.account_number) || bank.account_number || '',
      name: str(details.account_name) || bank.account_name || business.name,
      bank: str(details.bank_name) || bank.bank_name || '',
    },
    withdrawalAccount,
    walletBankId: bank.id,
    transactions: listFrom(response, ['results.transactions', 'results.data', 'data']).map(mapTransaction),
  }
}

export type WithdrawInput = { amount: number; pin: string; narration?: string }

const withdrawLive = async ({ amount, pin, narration }: WithdrawInput, wallet: Wallet) => {
  const account = wallet.withdrawalAccount
  if (!wallet.walletBankId) throw new Error('Complete KYC to open your wallet before withdrawing')
  if (!account) throw new Error('Add a settlement account in Settings › Payments first')

  const banks = await fetchBankList()
  const bank = banks.find(option => option.name.toLowerCase() === account.bank.toLowerCase())
  if (!bank) throw new Error(`We couldn't match ${account.bank} to a bank code. Re-add the account in Settings › Payments.`)

  const enquiry = await apiRequest<unknown>('wallet/beneficiary_enquiry/', { method: 'POST', body: { bank_code: bank.code, account_number: account.accountNumber } })
  const ref = str(at(enquiry, 'data.ref')) || str(at(enquiry, 'ref'))
  if (!ref) throw new Error('We could not verify your settlement account. Try again shortly.')

  await apiRequest<unknown>(`wallet/transfer/${wallet.walletBankId}/`, { method: 'POST', body: { pin, ref, amount, narration: narration || 'Wallet withdrawal' } })
  return { amount }
}

const withdrawMock = async ({ amount }: WithdrawInput) => {
  if (amount < MIN_WITHDRAWAL || amount > db.wallet.balance) throw new Error('Enter an amount within your available balance')
  db.wallet.balance -= amount
  db.wallet.transactions = [
    { id: `t${Date.now()}`, label: `Withdrawal to ${db.wallet.withdrawalAccount?.bank ?? 'bank'}`, date: formatShortDate(new Date().toISOString()), amount, kind: 'debit', icon: 'bank' },
    ...db.wallet.transactions,
  ]
  return mockDelay({ amount }, 700)
}

const useWalletKey = () => {
  const { businessId } = useCurrentBusinessId()
  const selectedBankId = useSelectedBankStore(state => state.selectedBankId)
  return { key: [...queryKeys.wallet, isLive() ? businessId : 'mock', selectedBankId] as const, businessId, selectedBankId }
}

export const useWallet = () => {
  const { key, businessId, selectedBankId } = useWalletKey()
  return useQuery({
    queryKey: key,
    queryFn: () => (isLive() ? getLiveWallet(businessId as string, selectedBankId) : mockDelay(structuredClone(db.wallet))),
    enabled: !isLive() || Boolean(businessId),
  })
}

export type WalletBankOption = { id: string; label: string; detail: string; primary: boolean }

/** The business's wallet accounts and the one currently selected (defaults to the primary). */
export const useWalletBanks = () => {
  const business = useCurrentBusiness()
  const selectedBankId = useSelectedBankStore(state => state.selectedBankId)
  const setSelectedBankId = useSelectedBankStore(state => state.setSelectedBankId)
  const banks = business.data?.banks ?? []
  const primary = primaryBank(banks)
  const options: WalletBankOption[] = banks.map(bank => ({
    id: bank.id,
    primary: bank.id === primary?.id,
    label: bank.id === primary?.id ? 'Main account' : bank.account_name || 'Sub-account',
    detail: [bank.bank_name, bank.account_number ? `••••${bank.account_number.slice(-4)}` : ''].filter(Boolean).join(' · '),
  }))
  const selected = options.find(option => option.id === selectedBankId) ?? options.find(option => option.primary)
  return { options, selectedId: selected?.id ?? null, select: setSelectedBankId }
}

// ─── Transaction history ────────────────────────────────────────────────────

export type TransactionsPage = { transactions: WalletTransaction[]; pages: number; inflow: number; outflow: number }

const getLiveTransactions = async (selectedBankId: string | null, filters: TransactionFilters): Promise<TransactionsPage> => {
  const business = await fetchCurrentBusiness()
  const bank = pickBank(business, selectedBankId)
  if (!bank) return { transactions: [], pages: 1, inflow: 0, outflow: 0 }
  const response = await fetchWalletPage(bank.id, filters)
  return {
    transactions: listFrom(response, ['results.transactions', 'results.data', 'data']).map(mapTransaction),
    pages: Math.max(num(at(response, 'pages')) || num(at(response, 'results.pages')) || 1, 1),
    inflow: num(at(response, 'results.inflow')),
    outflow: num(at(response, 'results.outflow')),
  }
}

const getMockTransactions = ({ search, type, page }: TransactionFilters): Promise<TransactionsPage> => {
  const term = search.trim().toLowerCase()
  const all = db.wallet.transactions.filter(trx => (!type || trx.kind === type.toLowerCase()) && (!term || trx.label.toLowerCase().includes(term)))
  const pages = Math.max(Math.ceil(all.length / TRANSACTIONS_PAGE_SIZE), 1)
  const sum = (kind: WalletTransaction['kind']) => db.wallet.transactions.filter(trx => trx.kind === kind).reduce((total, trx) => total + trx.amount, 0)
  return mockDelay({ transactions: all.slice((page - 1) * TRANSACTIONS_PAGE_SIZE, page * TRANSACTIONS_PAGE_SIZE), pages, inflow: sum('credit'), outflow: sum('debit') })
}

/** Filtered, paginated wallet history (same query params as sink-inventory's Transactions page). */
export const useWalletTransactions = (filters: TransactionFilters) => {
  const { businessId, selectedBankId } = useWalletKey()
  return useQuery({
    queryKey: [...queryKeys.wallet, 'transactions', isLive() ? businessId : 'mock', selectedBankId, filters],
    queryFn: () => (isLive() ? getLiveTransactions(selectedBankId, filters) : getMockTransactions(filters)),
    enabled: !isLive() || Boolean(businessId),
    placeholderData: keepPreviousData,
  })
}

/** Withdraws to the settlement account. Live: beneficiary enquiry + PIN-authorised transfer. */
export const useWithdraw = () => {
  const queryClient = useQueryClient()
  const { key } = useWalletKey()
  return useMutation({
    mutationFn: async (input: WithdrawInput) => {
      if (!isLive()) return withdrawMock(input)
      const wallet = queryClient.getQueryData<Wallet>(key)
      if (!wallet) throw new Error('Your wallet is still loading. Try again in a moment.')
      return withdrawLive(input, wallet)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.wallet }),
  })
}
