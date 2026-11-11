import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest, mockDelay } from '@/lib/api-client'
import { requireBusinessId, useCurrentBusinessId } from './business'
import { asRecord, at, isLive, listFrom, num, str, type UnknownRecord } from './http'
import { db, sampleCustomerTransactions } from './mock-data'
import { queryKeys } from './query-keys'

/**
 * Customers, same backend and payloads as sink-inventory:
 *  GET    customer/{business_id}/?search&status&page&limit → { total, pages, results: { data: Customer[], customer_count, total_spend, total_wallet, total_debt } }
 *  POST   customer/{business_id}/      { name, phone, email?, gender?, date_of_birth?, notes?, address? }
 *  GET    customer/single/{id}/        → { identity, purchase_behaviour, financial_details, …, data: Customer }
 *  PATCH  customer/single/{id}/        same fields plus birthday; null clears gender and birthday
 *  DELETE customer/single/{id}/
 *  GET    customer/transactions/{id}/?page&limit&type → { total, pages, results }
 * Mock mode (VITE_AUTH_MODE=mock) works on db.customers in memory.
 */

export const CUSTOMERS_PAGE_SIZE = 20

/** Sink's status filter (query param `status`). */
export const CUSTOMER_STATUS_OPTIONS = [
  { value: '', label: 'All customers' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'NEW', label: 'New' },
  { value: 'MOST_ACTIVE', label: 'Most active' },
  { value: 'LEAST_ACTIVE', label: 'Least active' },
  { value: 'AT_RISK', label: 'At risk' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'DEBTS', label: 'Owing' },
] as const

export type CustomerStatusFilter = typeof CUSTOMER_STATUS_OPTIONS[number]['value']

export type CustomerAddress = { address: string; city: string; state: string; country: string; phone: string; isDefault: boolean }

export type Customer = {
  id: string
  name: string
  email: string
  phone: string
  code: string
  totalSpent: number
  ordersCount: number
  walletBalance: number
  creditBalance: number
  status: string
  tier: string
  gender: string
  /** "YYYY-MM-DD", or "MM-DD" when no year was given. */
  dateOfBirth: string
  /** Plain-text notes about the customer. */
  notes: string
  lastVisit: string
  /** The default address, or null when none is on file. */
  address: CustomerAddress | null
}

export type CustomersSummary = { count: number; totalSpend: number; totalWallet: number; totalDebt: number }
export type CustomersResult = { customers: Customer[]; total: number; pages: number; summary: CustomersSummary }

export type CustomerInput = {
  name: string
  phone: string
  email?: string
  gender?: string
  dateOfBirth?: string
  notes?: string
  address?: CustomerAddress
}

// ─── Mapping ────────────────────────────────────────────────────────────────

const mapAddress = (value: unknown): CustomerAddress => {
  const record = asRecord(value)
  return { address: str(record.address), city: str(record.city), state: str(record.state), country: str(record.country), phone: str(record.phone), isDefault: record.is_default === true }
}

const STATUS_LABELS: Record<string, string> = { ACTIVE: 'Active', NEW: 'New', AT_RISK: 'At Risk', INACTIVE: 'Inactive' }

export const mapCustomer = (value: unknown): Customer => {
  const record = asRecord(value)
  const addresses = Array.isArray(record.addresses) ? record.addresses.map(mapAddress) : []
  const status = str(record.status)
  return {
    id: str(record.id),
    name: str(record.name),
    email: str(record.email),
    phone: str(record.phone),
    code: str(record.customer_code),
    totalSpent: num(record.lifetime_value ?? record.total_sales ?? record.total_spent),
    ordersCount: num(record.sales_count ?? record.visits),
    walletBalance: num(record.wallet_balance ?? record.wallet),
    creditBalance: num(record.credit_balance),
    status: STATUS_LABELS[status.toUpperCase().replace(' ', '_')] ?? status,
    tier: str(record.tier_name),
    gender: str(record.gender),
    dateOfBirth: str(record.date_of_birth) || str(record.birthday),
    notes: str(record.notes),
    lastVisit: str(record.last_visit),
    address: addresses.find(item => item.isDefault) ?? addresses[0] ?? null,
  }
}

/** Sink's nested address. A phone is only sent when editing. */
const toAddressBody = (address: CustomerAddress, isEdit: boolean) => ({
  address: address.address,
  city: address.city || undefined,
  state: address.state || undefined,
  country: address.country || 'Nigeria',
  ...(isEdit ? { phone: address.phone || null } : {}),
  is_default: address.isDefault,
})

// ─── Mock store ─────────────────────────────────────────────────────────────

const toMockRow = (input: CustomerInput, base: UnknownRecord = {}): UnknownRecord => ({
  ...base,
  name: input.name,
  phone: input.phone,
  email: input.email ?? '',
  gender: input.gender || null,
  date_of_birth: input.dateOfBirth || null,
  notes: input.notes ?? '',
  addresses: input.address ? [{ ...toAddressBody(input.address, true), id: 'addr-1' }] : [],
})

const mockMatches = (search: string, status: string) => {
  const term = search.toLowerCase()
  const digits = search.replace(/\D/g, '')
  return db.customers.filter(record => {
    const customer = mapCustomer(record)
    const matchesTerm = !term || [customer.name, customer.email].some(value => value.toLowerCase().includes(term)) || (digits.length > 0 && customer.phone.replace(/\D/g, '').includes(digits))
    const matchesStatus = !status || (status === 'DEBTS' ? customer.creditBalance > 0 : str(record.status).toUpperCase().replace(' ', '_') === status)
    return matchesTerm && matchesStatus
  })
}

// ─── List ───────────────────────────────────────────────────────────────────

type ListParams = { page: number; limit: number; search: string; status: string }

const getMockCustomers = ({ page, limit, search, status }: ListParams): Promise<CustomersResult> => {
  const matches = mockMatches(search, status)
  const all = db.customers.map(mapCustomer)
  const sum = (pick: (customer: Customer) => number) => all.reduce((total, customer) => total + pick(customer), 0)
  return mockDelay({
    customers: matches.slice((page - 1) * limit, page * limit).map(mapCustomer),
    total: matches.length,
    pages: Math.max(1, Math.ceil(matches.length / limit)),
    summary: { count: all.length, totalSpend: sum(customer => customer.totalSpent), totalWallet: sum(customer => customer.walletBalance), totalDebt: sum(customer => customer.creditBalance) },
  })
}

const getCustomers = async (businessId: string, { page, limit, search, status }: ListParams): Promise<CustomersResult> => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (search) params.set('search', search)
  if (status) params.set('status', status)
  const response = await apiRequest<unknown>(`customer/${businessId}/?${params.toString()}`)
  const customers = listFrom(response, ['results.data', 'data.results.data', 'results', 'data']).map(mapCustomer)
  const total = num(at(response, 'total')) || num(at(response, 'results.customer_count')) || customers.length
  const results = asRecord(at(response, 'results'))
  return {
    customers,
    total,
    pages: Math.max(1, num(at(response, 'pages')) || Math.ceil(total / limit)),
    summary: {
      count: num(results.customer_count) || total,
      totalSpend: num(results.total_spend) || customers.reduce((sum, customer) => sum + customer.totalSpent, 0),
      totalWallet: num(results.total_wallet),
      totalDebt: num(results.total_debt),
    },
  }
}

/** Server-paged customer list with search and status filter. Reusable anywhere a customer list is needed. */
export const useCustomers = ({ page = 1, limit = CUSTOMERS_PAGE_SIZE, search = '', status = '', enabled = true }: { page?: number; limit?: number; search?: string; status?: string; enabled?: boolean } = {}) => {
  const { businessId } = useCurrentBusinessId()
  const live = isLive()
  const params = { page, limit, search, status }
  return useQuery({
    queryKey: [...queryKeys.customers, 'list', live ? businessId : 'mock', params],
    queryFn: () => (live ? getCustomers(businessId as string, params) : getMockCustomers(params)),
    enabled: enabled && (!live || Boolean(businessId)),
    placeholderData: keepPreviousData,
  })
}

// ─── Detail ─────────────────────────────────────────────────────────────────

export type CustomerDetail = {
  customer: Customer
  customerSince: string
  totalOrders: number
  totalSpend: number
  averageBasket: number
  lastPurchase: string
  favouriteProduct: string
  preferredPayment: string
  walletBalance: number
  outstandingBalance: number
  segment: string
  tier: string
}

const mapDetail = (response: unknown): CustomerDetail => {
  const outer = asRecord(response)
  // Answered either bare or inside { success, data, message }.
  const inner = asRecord(outer.data)
  const root = outer.identity ? outer : inner.identity ? inner : outer
  const identity = asRecord(root.identity)
  const purchase = asRecord(root.purchase_behaviour)
  const financial = asRecord(root.financial_details)
  const loyalty = asRecord(root.loyalty_rewards)
  const row = asRecord(asRecord(root.data).id ? root.data : inner.id ? inner : root)
  const base = mapCustomer(row)
  // The top-level sections carry the real figures; the nested row can lag (sink's customerDetail.ts).
  const customer: Customer = {
    ...base,
    name: str(identity.name) || base.name,
    phone: str(identity.phone) || base.phone,
    email: str(identity.email) || base.email,
    gender: str(identity.gender) || base.gender,
    dateOfBirth: str(identity.date_of_birth) || base.dateOfBirth,
    notes: base.notes || str(identity.notes),
  }
  return {
    customer,
    customerSince: str(identity.customer_since),
    totalOrders: num(purchase.total_orders ?? financial.total_orders) || base.ordersCount,
    totalSpend: num(purchase.total_spend ?? financial.total_lifetime_spend) || base.totalSpent,
    averageBasket: num(purchase.average_basket_size ?? financial.avg_basket_size),
    lastPurchase: str(purchase.last_purchase_date),
    favouriteProduct: str(purchase.favourite_product),
    preferredPayment: str(purchase.preferred_payment),
    walletBalance: num(financial.wallet_balance) || base.walletBalance,
    outstandingBalance: num(financial.outstanding_balance ?? financial.credit_balance) || base.creditBalance,
    segment: str(identity.segment) || str(row.segment),
    tier: str(loyalty.loyalty_tier) || base.tier,
  }
}

const getCustomer = async (id: string) => {
  if (!isLive()) {
    const record = db.customers.find(item => str(item.id) === id)
    if (!record) throw new Error('Customer not found')
    const customer = mapCustomer(record)
    return mockDelay(mapDetail({ data: { identity: { customer_since: 'Mar 2026' }, purchase_behaviour: { average_basket_size: customer.ordersCount ? Math.round(customer.totalSpent / customer.ordersCount) : 0, preferred_payment: 'Bank transfer' }, data: record } }))
  }
  return mapDetail(await apiRequest<unknown>(`customer/single/${id}/`))
}

export const useCustomer = (id: string | undefined) => useQuery({
  queryKey: [...queryKeys.customers, 'detail', id],
  queryFn: () => getCustomer(id as string),
  enabled: Boolean(id),
  // A missing customer won't appear on a retry.
  retry: (count, error) => !(error instanceof Error && error.message === 'Customer not found') && count < 2,
})

// ─── Transactions ledger ────────────────────────────────────────────────────

export const CUSTOMER_TRANSACTION_TYPES = [
  { value: 'ALL', label: 'All' },
  { value: 'PURCHASE', label: 'Purchases' },
  { value: 'WALLET', label: 'Wallet' },
  { value: 'DEBT', label: 'Debt' },
  { value: 'LOYALTY', label: 'Loyalty' },
  { value: 'REFERRAL', label: 'Referral' },
] as const
export type CustomerTransactionType = typeof CUSTOMER_TRANSACTION_TYPES[number]['value']

export type CustomerTransaction = {
  id: string
  type: string
  title: string
  reference: string
  amount: number
  flow: 'INFLOW' | 'OUTFLOW'
  paymentMethod: string
  status: string
  attendant: string
  createdAt: string
}

const mapTransaction = (value: unknown, index: number): CustomerTransaction => {
  const record = asRecord(value)
  return {
    id: str(record.id) || `trx-${index}`,
    type: str(record.type).toUpperCase(),
    title: str(record.title) || str(record.type),
    reference: str(record.reference),
    amount: num(record.amount),
    flow: str(record.flow).toUpperCase() === 'INFLOW' ? 'INFLOW' : 'OUTFLOW',
    paymentMethod: str(record.payment_method),
    status: str(record.status),
    attendant: str(record.attendant),
    createdAt: str(record.created_at),
  }
}

type TransactionsParams = { page: number; limit: number; type: CustomerTransactionType }
export type CustomerTransactionsPage = { rows: CustomerTransaction[]; pages: number; total: number }

const getCustomerTransactions = async (id: string, { page, limit, type }: TransactionsParams): Promise<CustomerTransactionsPage> => {
  if (!isLive()) {
    const all = sampleCustomerTransactions(id).filter(item => type === 'ALL' || item.type === type)
    return mockDelay({ rows: all.slice((page - 1) * limit, page * limit).map(mapTransaction), pages: Math.max(1, Math.ceil(all.length / limit)), total: all.length })
  }
  const params = new URLSearchParams({ page: String(page), limit: String(limit), type })
  const response = asRecord(await apiRequest<unknown>(`customer/transactions/${id}/?${params.toString()}`))
  const data = response.results ? response : asRecord(response.data)
  return { rows: listFrom(data.results, []).map(mapTransaction), pages: Math.max(1, num(data.pages)), total: num(data.total) }
}

export const useCustomerTransactions = (id: string | undefined, params: TransactionsParams, enabled = true) => useQuery({
  queryKey: [...queryKeys.customers, 'transactions', id, params],
  queryFn: () => getCustomerTransactions(id as string, params),
  enabled: enabled && Boolean(id),
  placeholderData: keepPreviousData,
})

// ─── Writes ─────────────────────────────────────────────────────────────────

const createCustomer = async (input: CustomerInput): Promise<Customer> => {
  if (!isLive()) {
    const record = toMockRow(input, { id: `mock-cus-${Date.now()}`, total_sales: 0, sales_count: 0, wallet_balance: 0, credit_balance: 0, status: 'New', created_at: new Date().toISOString() })
    db.customers = [record, ...db.customers]
    return mockDelay(mapCustomer(record), 400)
  }
  // Unanswered fields are left out: the serializer rejects "" for a choice field.
  const body = {
    name: input.name,
    phone: input.phone,
    ...(input.email ? { email: input.email } : {}),
    ...(input.gender ? { gender: input.gender } : {}),
    ...(input.dateOfBirth ? { date_of_birth: input.dateOfBirth } : {}),
    ...(input.notes ? { notes: input.notes } : {}),
    ...(input.address ? { address: toAddressBody(input.address, false) } : {}),
  }
  const response = asRecord(await apiRequest<unknown>(`customer/${requireBusinessId()}/`, { method: 'POST', body }))
  const data = asRecord(response.data ?? response)
  const mapped = mapCustomer(asRecord(data.customer).id ? data.customer : data)
  return { ...mapped, name: mapped.name || input.name, phone: mapped.phone || input.phone }
}

const updateCustomer = async ({ id, input }: { id: string; input: CustomerInput }) => {
  if (!isLive()) {
    db.customers = db.customers.map(record => (str(record.id) === id ? toMockRow(input, record) : record))
    return mockDelay(null, 400)
  }
  return apiRequest<unknown>(`customer/single/${id}/`, { method: 'PATCH', body: {
    name: input.name,
    phone: input.phone,
    email: input.email ?? '',
    gender: input.gender || null,
    date_of_birth: input.dateOfBirth || null,
    birthday: input.dateOfBirth || null,
    notes: input.notes ?? '',
    ...(input.address ? { address: toAddressBody(input.address, true) } : {}),
  } })
}

const deleteCustomer = async (id: string) => {
  if (!isLive()) {
    db.customers = db.customers.filter(record => str(record.id) !== id)
    return mockDelay(null, 300)
  }
  return apiRequest<unknown>(`customer/single/${id}/`, { method: 'DELETE' })
}

export const useCreateCustomer = () => {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: createCustomer, onSuccess: () => queryClient.invalidateQueries({ queryKey: [...queryKeys.customers, 'list'] }) })
}

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: updateCustomer, onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.customers }) })
}

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteCustomer,
    onSuccess: (_, id) => {
      // Drop the deleted profile instead of refetching it (that would just 404), then refresh the lists.
      queryClient.removeQueries({ queryKey: [...queryKeys.customers, 'detail', id] })
      return queryClient.invalidateQueries({ queryKey: [...queryKeys.customers, 'list'] })
    },
  })
}
