import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { apiRequest, mockDelay } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth-store'
import { useSelectedBankStore } from '@/stores/selected-bank-store'
import { fetchBankList } from './banks'
import { useCurrentBusiness, useCurrentBusinessId, type BusinessBank } from './business'
import { asRecord, at, isLive, listFrom, num, str } from './http'
import { queryKeys } from './query-keys'

/**
 * Wallet & transactions — a direct port of sink-inventory's Transactions page data
 * (hooks/useTransactionsHook, useUnifiedTransactionsHook, useBusinessBanks and
 * api/transactions/*). Same endpoints, params and rules:
 *  GET  wallet/{bank_id}/?page&limit=20&search&type&mode&start_date&end_date
 *       → { results: { wallet_details, inflow, outflow, transactions }, pages, total }
 *  GET  wallet/banks/                                   transfer bank list
 *  POST wallet/beneficiary_enquiry/  { bank_code, account_number } → { data: { name, ref } }
 *  GET  wallet/recent_beneficiaries/{bank_id}/?limit    accounts paid before
 *  GET  category/{business_id}/?type=EXPENSES           transfer categories
 *  POST wallet/transfer/{bank_id}/   { pin, ref, amount, narration, category }
 *  POST wallet/create_sub_account/{business_id}/ { previous_account, branch }
 */

export const TRANSACTIONS_PAGE_SIZE = 20

/** sink's transfer fee: ₦10 up to ₦5,000, ₦25 up to ₦50,000, ₦50 above. */
export const transferCharge = (amount: number | string) => {
  const value = Number(amount)
  if (!amount || !value) return 0
  if (value <= 5000) return 10
  if (value <= 50000) return 25
  return 50
}

// ─── Permissions: decided in stores/types permissionsFor (sink's checks, lib/access-map.ts) ─────────

export const useIsOwner = () => useAuthStore(state => state.user?.role === 'OWNER' || !state.user?.role)

// ─── Bank accounts (sink: useBusinessBanks) ─────────────────────────────────

/**
 * The business's bank accounts and which one the wallet screens read. Primary is
 * the account with is_sub !== true. Only owners switch accounts; everyone else is
 * pinned to the primary, and a stored id that no longer exists is reset.
 */
export const useBusinessBanks = () => {
  const isOwner = useIsOwner()
  const { data: business } = useCurrentBusiness()
  const selectedBankId = useSelectedBankStore(state => state.selectedBankId)
  const setSelectedBankId = useSelectedBankStore(state => state.setSelectedBankId)

  const banks = useMemo<BusinessBank[]>(() => (isLive() ? business?.banks ?? [] : MOCK_BANKS), [business])
  const primaryBank = useMemo(() => banks.find(bank => bank.is_sub !== true) ?? banks[0] ?? null, [banks])
  const selectedBank = useMemo(() => (isOwner ? banks.find(bank => bank.id === selectedBankId) ?? primaryBank : primaryBank), [banks, selectedBankId, primaryBank, isOwner])

  useEffect(() => {
    if (!isOwner || !banks.length) return
    if (!banks.some(bank => bank.id === selectedBankId) && primaryBank?.id) setSelectedBankId(primaryBank.id)
  }, [banks, selectedBankId, primaryBank, setSelectedBankId, isOwner])

  return {
    banks,
    primaryBank,
    selectedBank,
    selectedBankId: selectedBank?.id ?? null,
    setSelectedBankId,
    canSwitchBanks: isOwner && banks.length > 1,
    isPrimary: (bank: BusinessBank) => bank.id === primaryBank?.id,
    /** sink: `!businessData?.kyc` opens the "Complete your KYC verification" prompt. */
    needsKyc: isLive() ? Boolean(business) && !business?.raw.kyc : false,
    businessId: business?.id ?? null,
  }
}

// ─── Wallet page (balance + transactions) ───────────────────────────────────

export type TransactionFilter = 'ALL' | 'CREDIT' | 'DEBIT' | 'ONLINE'
export type TransactionQuery = { page: number; search: string; filter: TransactionFilter; startDate: string; endDate: string; limit?: number }

export type WalletTrx = {
  id: string
  accountName: string
  accountNumber: string
  bankName: string
  type: 'CREDIT' | 'DEBIT'
  channel: string
  isBnpl: boolean
  bnplReference: string
  amount: number
  charges: number
  description: string
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | string
  createdAt: string
  reference: string
}

export type WalletAccountPage = {
  wallet: { balance: number; accountName: string; accountNumber: string; bankName: string } | null
  inflow: number
  outflow: number
  transactions: WalletTrx[]
  pages: number
  total: number
}

const mapTrx = (value: unknown, index: number): WalletTrx => {
  const trx = asRecord(value)
  return {
    id: str(trx.id) || `trx-${index}`,
    accountName: str(trx.account_name),
    accountNumber: str(trx.account_number),
    bankName: str(trx.bank_name),
    type: str(trx.type).toUpperCase() === 'CREDIT' ? 'CREDIT' : 'DEBIT',
    channel: str(trx.mode) || str(trx.source) || '-',
    isBnpl: trx.is_bnpl === true,
    bnplReference: str(asRecord(trx.bnpl_details).order_reference),
    amount: num(trx.amount),
    charges: num(trx.charges),
    description: str(trx.description) || str(trx.narration),
    status: str(trx.status).toUpperCase() || 'PENDING',
    createdAt: str(trx.created_at),
    // sink's extractTransactionId: the provider's reference when there is one.
    reference: str(trx.transaction_id) || str(trx.reference) || str(trx.session_id) || str(trx.id),
  }
}

const getWalletPage = async (bankId: string, query: TransactionQuery): Promise<WalletAccountPage> => {
  const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit ?? TRANSACTIONS_PAGE_SIZE) })
  if (query.search) params.set('search', query.search)
  if (query.filter === 'CREDIT' || query.filter === 'DEBIT') params.set('type', query.filter)
  if (query.filter === 'ONLINE') params.set('mode', 'ONLINE')
  if (query.startDate) params.set('start_date', query.startDate)
  if (query.endDate) params.set('end_date', query.endDate)
  const response = await apiRequest<unknown>(`wallet/${bankId}/?${params.toString()}`)
  const details = asRecord(at(response, 'results.wallet_details'))
  return {
    wallet: Object.keys(details).length ? { balance: num(details.balance), accountName: str(details.account_name), accountNumber: str(details.account_number), bankName: str(details.bank_name) } : null,
    inflow: num(at(response, 'results.inflow')),
    outflow: num(at(response, 'results.outflow')),
    transactions: listFrom(response, ['results.transactions', 'data.results.transactions']).map(mapTrx),
    pages: Math.max(num(at(response, 'pages')) || num(at(response, 'results.pages')) || 1, 1),
    total: num(at(response, 'total')),
  }
}

/** sink only searches once the term is empty or at least 3 characters. */
const effectiveSearch = (search: string) => (search.length === 0 || search.length >= 3 ? search : null)

export const useWalletAccount = (query: TransactionQuery) => {
  const { selectedBankId } = useBusinessBanks()
  const search = effectiveSearch(query.search.trim())
  const settled = { ...query, search: search ?? '' }
  return useQuery({
    queryKey: [...queryKeys.wallet, 'account', isLive() ? selectedBankId : 'mock', settled],
    queryFn: () => (isLive() ? getWalletPage(selectedBankId as string, settled) : getMockWalletPage(settled)),
    enabled: (!isLive() || Boolean(selectedBankId)) && search !== null,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Transfer ───────────────────────────────────────────────────────────────

export type TransferBank = { code: string; name: string }
export type Beneficiary = { name: string; ref: string }
export type RecentBeneficiary = { accountName: string; accountNumber: string; bankName: string; bankCode: string | null; bankLogo: string | null }
export type ExpenseCategory = { id: string; name: string }

export const useTransferBanks = (enabled: boolean) =>
  useQuery({ queryKey: ['wallet', 'banks'], queryFn: fetchBankList, enabled, staleTime: 60 * 60 * 1000 })

const enquire = async ({ bankCode, accountNumber }: { bankCode: string; accountNumber: string }): Promise<Beneficiary> => {
  if (!isLive()) return mockDelay({ name: 'ADAEZE OKAFOR', ref: 'mock-ref' }, 600)
  const response = await apiRequest<unknown>('wallet/beneficiary_enquiry/', { method: 'POST', body: { bank_code: bankCode, account_number: accountNumber } })
  const name = str(at(response, 'data.name')) || str(at(response, 'name'))
  if (!name) throw new Error('We could not verify this account. Check the bank and account number.')
  return { name, ref: str(at(response, 'data.ref')) || str(at(response, 'ref')) }
}

/** sink runs the enquiry automatically once a bank is picked and the number has 10 digits. */
export const useBeneficiaryEnquiry = (bankCode: string, accountNumber: string) =>
  useQuery({
    queryKey: ['wallet', 'beneficiary', bankCode, accountNumber],
    queryFn: () => enquire({ bankCode, accountNumber }),
    enabled: Boolean(bankCode) && accountNumber.length === 10,
    retry: false,
    staleTime: 10 * 60 * 1000,
  })

const getRecentBeneficiaries = async (bankId: string): Promise<RecentBeneficiary[]> => {
  if (!isLive()) return mockDelay([{ accountName: 'TOLA MARTINS', accountNumber: '0123456789', bankName: 'Access Bank', bankCode: '044', bankLogo: null }])
  const response = await apiRequest<unknown>(`wallet/recent_beneficiaries/${bankId}/?limit=6`)
  return listFrom(response, ['data', 'results', 'data.results']).map(value => {
    const row = asRecord(value)
    return { accountName: str(row.account_name), accountNumber: str(row.account_number), bankName: str(row.bank_name), bankCode: str(row.bank_code) || null, bankLogo: str(row.bank_logo) || null }
  }).filter(row => row.accountNumber)
}

export const useRecentBeneficiaries = (bankId: string | null, enabled: boolean) =>
  useQuery({ queryKey: ['wallet', 'recent-beneficiaries', bankId], queryFn: () => getRecentBeneficiaries(bankId as string), enabled: enabled && (Boolean(bankId) || !isLive()), staleTime: 5 * 60 * 1000 })

const getExpenseCategories = async (businessId: string): Promise<ExpenseCategory[]> => {
  if (!isLive()) return mockDelay([{ id: '1', name: 'Logistics' }, { id: '2', name: 'Supplies' }, { id: '3', name: 'Salaries' }])
  const response = await apiRequest<unknown>(`category/${businessId}/?type=EXPENSES`)
  return listFrom(response, ['data', 'results', 'data.results']).map(value => ({ id: str(asRecord(value).id), name: str(asRecord(value).name) })).filter(category => category.id)
}

export const useExpenseCategories = (enabled: boolean) => {
  const { businessId } = useCurrentBusinessId()
  return useQuery({ queryKey: ['categories', 'EXPENSES', businessId], queryFn: () => getExpenseCategories(businessId as string), enabled: enabled && (Boolean(businessId) || !isLive()), staleTime: 5 * 60 * 1000 })
}

export type TransferInput = { bankId: string; pin: string; ref: string; amount: string; narration: string; categoryId?: string }

const transfer = async ({ bankId, pin, ref, amount, narration, categoryId }: TransferInput) => {
  if (!isLive()) return mockDelay({ transaction_id: `TRF${Date.now()}` }, 900)
  return apiRequest<unknown>(`wallet/transfer/${bankId}/`, { method: 'POST', body: { pin, ref, amount, narration, category: categoryId } })
}

export const useTransfer = () => {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: transfer, onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.wallet }) })
}

/** Pulls the transaction id out of a transfer response (sink: extractTransactionId). */
export const extractTransactionId = (response: unknown) =>
  str(at(response, 'data.transaction_id')) || str(at(response, 'transaction_id')) || str(at(response, 'data.reference')) || str(at(response, 'reference')) || str(at(response, 'data.id')) || ''

// ─── Sub-account ────────────────────────────────────────────────────────────

const createSubAccount = async ({ businessId, previousAccount, branch }: { businessId: string; previousAccount: string; branch: string }) => {
  if (!isLive()) return mockDelay(null, 700)
  return apiRequest<unknown>(`wallet/create_sub_account/${businessId}/`, { method: 'POST', body: { previous_account: previousAccount, branch } })
}

export const useCreateSubAccount = () => {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: createSubAccount, onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.business }) })
}

// ─── Mock (VITE_AUTH_MODE=mock only) ────────────────────────────────────────

const MOCK_BANKS: BusinessBank[] = [{ id: 'mock-bank', bank_name: 'VFD Microfinance Bank', account_number: '1028459731', account_name: 'Kemi Adeyemi Stores Ltd', is_sub: false }]

const MOCK_TRX: WalletTrx[] = [
  { id: 'a91f3c2e7b6d', accountName: 'Seyi Martins', accountNumber: '0123456789', bankName: 'GTBank', type: 'CREDIT', channel: 'ONLINE', isBnpl: false, bnplReference: '', amount: 48000, charges: 0, description: 'Order SH-28442', status: 'SUCCESS', createdAt: new Date().toISOString(), reference: 'TRF-28442' },
  { id: 'b72e1d4a9c03', accountName: 'Kwik Delivery', accountNumber: '2034567810', bankName: 'Access Bank', type: 'DEBIT', channel: 'TRANSFER', isBnpl: false, bnplReference: '', amount: 4650, charges: 10, description: 'Delivery fee', status: 'SUCCESS', createdAt: new Date(Date.now() - 86400000).toISOString(), reference: 'TRF-28451' },
  { id: 'c5d8e2f1a3b4', accountName: 'Amaka Nwosu', accountNumber: '0099887766', bankName: 'Akawopay', type: 'CREDIT', channel: 'ONLINE', isBnpl: true, bnplReference: 'AKW-1042', amount: 32500, charges: 0, description: 'Akawopay settlement', status: 'PENDING', createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), reference: 'AKW-1042' },
]

const getMockWalletPage = (query: TransactionQuery): Promise<WalletAccountPage> => {
  const term = query.search.toLowerCase()
  const rows = MOCK_TRX.filter(trx =>
    (query.filter === 'ALL' || (query.filter === 'ONLINE' ? trx.channel === 'ONLINE' : trx.type === query.filter)) &&
    (!term || [trx.accountName, trx.description, trx.id].some(value => value.toLowerCase().includes(term))))
  const sum = (type: WalletTrx['type']) => MOCK_TRX.filter(trx => trx.type === type).reduce((total, trx) => total + trx.amount, 0)
  return mockDelay({ wallet: { balance: 184350, accountName: 'Kemi Adeyemi Stores Ltd', accountNumber: '1028459731', bankName: 'VFD Microfinance Bank' }, inflow: sum('CREDIT'), outflow: sum('DEBIT'), transactions: rows, pages: 1, total: rows.length })
}
