import { useMutation, useQuery } from '@tanstack/react-query'
import { apiRequest, mockDelay } from '@/lib/api-client'
import { useIsAuthenticated } from '@/stores/auth-store'
import { useCurrentBusiness } from './business'
import { asRecord, isLive, listFrom, num, str, type UnknownRecord } from './http'
import { queryKeys } from './query-keys'

/**
 * Plans, as sink-inventory's Premium / Plan pages. One subscription per account, the same fields across
 * Sync360 products; Sync Ship reads the ones that apply to it:
 *  GET  user/plans/                      every tier with its prices and gated fields (-1 = unlimited)
 *  GET  user/active_plan/?business_id=   the current plan and live usage; business_id only for a branch
 *                                        billed on its own (not the founding one)
 *  POST user/subscribe/                  { plan, duration: MONTHLY|QUARTERLY|BIANNUAL|ANNUAL, business_id? } → { data: { payment_url } }
 * Product uploads, orders received and the online order page are unlimited on every plan, so only
 * attendants (shared with POS / Booking), branches and the custom domain are gated here.
 * A branch that isn't the founding one needs its own subscription before its features unlock
 * (business.is_founding / is_subscribed).
 */

export type PlanField = 'no_of_attendants' | 'no_of_business' | 'custom_domain'
export type CountField = Exclude<PlanField, 'custom_domain'>
export type BillingPeriod = 'MONTHLY' | 'QUARTERLY' | 'BIANNUAL' | 'ANNUAL'

export const BILLING_PERIODS: { value: BillingPeriod; label: string; priceKey: string; months: number }[] = [
  { value: 'MONTHLY', label: 'Monthly', priceKey: 'monthly', months: 1 },
  { value: 'QUARTERLY', label: 'Quarterly', priceKey: 'quarterly', months: 3 },
  { value: 'BIANNUAL', label: '6 months', priceKey: 'biannually', months: 6 },
  { value: 'ANNUAL', label: 'Yearly', priceKey: 'annually', months: 12 },
]

/** What Sync Ship gates per plan, in the backend's own wording of the matrix. */
export const SHIP_PLAN_FEATURES: { field: PlanField; label: string }[] = [
  { field: 'no_of_attendants', label: 'Attendants' },
  { field: 'no_of_business', label: 'Branches' },
  { field: 'custom_domain', label: 'Custom domain' },
]

/** Always on, whatever the plan (shown as "Unlimited · every plan"). */
export const SHIP_UNLIMITED_FEATURES = ['Product uploads', 'Orders received', 'Online order page'] as const

export type PlanLimits = Partial<Record<PlanField, number | boolean>>
export type Plan = { raw?: UnknownRecord; id: string; name: string; prices: Record<string, number>; limits: PlanLimits }
export type ActivePlan = {
  name: string
  /** The fields sink's Premium screen shows, straight from active_plan. */
  summary: PlanSummary
  endsAt: string
  amount: number
  duration: string
  limits: PlanLimits
  /** Live usage, where the backend reports it. */
  usage: Partial<Record<CountField, number>>
  customDomainAllowed: boolean | null
}

const readLimit = (record: UnknownRecord, field: PlanField): number | boolean | undefined => {
  const value = record[field]
  if (value === undefined || value === null || value === '') return undefined
  return typeof value === 'boolean' ? value : num(value)
}
const limitsOf = (record: UnknownRecord): PlanLimits =>
  Object.fromEntries(SHIP_PLAN_FEATURES.map(({ field }) => [field, readLimit(record, field)]).filter(([, value]) => value !== undefined))

const mapPlan = (value: unknown): Plan => {
  const p = asRecord(value)
  return { raw: p, id: str(p.id), name: str(p.name), prices: Object.fromEntries(BILLING_PERIODS.map(period => [period.priceKey, num(p[period.priceKey])])), limits: limitsOf(p) }
}

/** Usage keys the active plan may carry for each counter (not documented yet; read defensively). */
const USAGE_KEYS: Record<CountField, string[]> = {
  // sink's Premium screen lists `attendants` under Features next to customer_count / business_count: a count.
  no_of_attendants: ['attendants', 'attendants_count', 'attendant_count'],
  no_of_business: ['business_count', 'businesses_count', 'branches_count', 'current_business'],
}

/** sink's Premium screen, field for field: what active_plan reports, shown as-is (-1 = ∞, missing = not shown). */
export type PlanSummary = {
  amount: number
  duration: string
  startDate: string
  endDate: string
  businesses: number | null
  attendants: number | null
  inventoryCount: number | null
  inventoryLimit: number | null
  customerCount: number | null
  customerLimit: number | null
  bookingsCount: number | null
  bookingsLimit: number | null
}
const maybeNum = (value: unknown) => (value === undefined || value === null || value === '' ? null : num(value))
export const summaryOf = (root: UnknownRecord): PlanSummary => ({
  amount: num(root.amount),
  duration: str(root.duration),
  startDate: str(root.start_date),
  endDate: str(root.end_date),
  businesses: maybeNum(root.business_count),
  attendants: maybeNum(root.attendants),
  inventoryCount: maybeNum(root.inventory_count),
  inventoryLimit: maybeNum(root.inventory_limit),
  customerCount: maybeNum(root.customer_count),
  customerLimit: maybeNum(root.customer_limit),
  bookingsCount: maybeNum(root.bookings_count),
  bookingsLimit: maybeNum(root.bookings_limit),
})

/**
 * user/active_plan/ is flat (sink's /api/premium passes it through as-is; its Premium screen reads):
 * amount, duration, end_date, custom_domain_allowed, usage counts (customer_count, business_count,
 * attendants, inventory_count, bookings_count) and some limits (customer_limit, inventory_limit,
 * bookings_limit). It has no plan name or id, so the tier is found by matching amount + duration against
 * user/plans/ prices, and that tier's limits fill the gaps (attendants, branches). active_plan's own limits win.
 */
const mapActivePlan = (value: unknown): ActivePlan => {
  const root = asRecord(asRecord(value).data ?? value)
  const plan = asRecord(root.plan ?? root.subscription ?? root)
  const limits = asRecord(root.limits)
  const usage = asRecord(root.usage)
  const used: ActivePlan['usage'] = {}
  for (const [field, keys] of Object.entries(USAGE_KEYS) as [CountField, string[]][]) {
    const key = keys.find(k => usage[k] !== undefined || root[k] !== undefined)
    if (key) used[field] = num(usage[key] ?? root[key])
  }
  return {
    summary: summaryOf(root),
    name: str(plan.name) || str(root.plan_name),
    endsAt: str(root.end_date) || str(root.subscription_end_date),
    amount: num(root.amount),
    duration: str(root.duration).toUpperCase(),
    limits: { ...limitsOf(asRecord(root.plan)), ...limitsOf(limits) },
    usage: used,
    customDomainAllowed: typeof root.custom_domain_allowed === 'boolean' ? root.custom_domain_allowed : null,
  }
}

const SAMPLE_PLANS: Plan[] = [
  { id: '1', name: 'FREE', prices: { monthly: 0, quarterly: 0, biannually: 0, annually: 0 }, limits: { no_of_attendants: 1, no_of_business: 1, custom_domain: false } },
  { id: '2', name: 'STARTER', prices: { monthly: 5000, quarterly: 14000, biannually: 27000, annually: 50000 }, limits: { no_of_attendants: 3, no_of_business: 1, custom_domain: false } },
  { id: '3', name: 'SYNC-PRO', prices: { monthly: 15000, quarterly: 42000, biannually: 80000, annually: 150000 }, limits: { no_of_attendants: 10, no_of_business: 3, custom_domain: true } },
]

/** A non-founding branch is billed on its own (sink's utils/branchSubscription). Strict on is_founding === false. */
export const useBranchSubscription = () => {
  const business = useCurrentBusiness()
  const raw = business.data?.raw ?? {}
  const separatelyBilled = raw.is_founding === false
  return {
    planBusinessId: separatelyBilled ? str(raw.id) || business.data?.id || null : null,
    locked: separatelyBilled && raw.is_subscribed !== true,
    branchName: business.data?.name ?? '',
  }
}

export const usePlans = () => {
  const authenticated = useIsAuthenticated()
  return useQuery({
    queryKey: queryKeys.plans,
    queryFn: async () => (isLive() ? listFrom(await apiRequest<unknown>('user/plans/?page=1&limit=15'), ['results', 'data', 'results.data', 'data.results']).map(mapPlan) : mockDelay(SAMPLE_PLANS)),
    staleTime: 10 * 60 * 1000,
    enabled: authenticated,
  })
}

/**
 * The plan in force. `account: true` always reads the owner's account plan (e.g. when creating a
 * business); otherwise a separately billed branch reads its own.
 */
const useActivePlanRaw = ({ account = false }: { account?: boolean } = {}) => {
  const authenticated = useIsAuthenticated()
  const { planBusinessId } = useBranchSubscription()
  const businessId = account ? null : planBusinessId
  return useQuery({
    queryKey: [...queryKeys.activePlan, businessId ?? 'founding'],
    queryFn: async () => (isLive()
      ? mapActivePlan(await apiRequest<unknown>(`user/active_plan/${businessId ? `?business_id=${encodeURIComponent(businessId)}` : ''}`))
      : mockDelay<ActivePlan>({ summary: summaryOf({ amount: 0, duration: 'ANNUAL', start_date: '2025-03-17', end_date: '2036-03-24', inventory_count: 420, inventory_limit: 6000, customer_count: 1, customer_limit: -1 }), name: 'FREE', endsAt: '', amount: 0, duration: '', limits: SAMPLE_PLANS[0].limits, usage: { no_of_attendants: 1, no_of_business: 1 }, customDomainAllowed: false })),
    retry: (count, error) => ![401, 404].includes((error as { status?: number })?.status ?? 0) && count < 1,
    staleTime: 60 * 1000,
    enabled: authenticated,
  })
}


/**
 * The tier the business is on. active_plan has no plan name or number (plan_id is the subscription's id)
 * and the amount can be ₦0 on a comped plan, so the price says nothing: the tier is the one whose
 * inventory_count and customers_count equal active_plan's inventory_limit and customer_limit. No match → none.
 */
export const matchPlan = (active: ActivePlan, plans: Plan[]) => {
  const { inventoryLimit, customerLimit } = active.summary
  if (inventoryLimit === null || customerLimit === null) return undefined
  const found = plans.filter(plan => plan.raw && num(plan.raw.inventory_count) === inventoryLimit && num(plan.raw.customers_count) === customerLimit)
  return found.length === 1 ? found[0] : undefined
}

/** The plan in force, filled in from its tier (see mapActivePlan). `account: true` reads the owner's account plan. */
export const useActivePlan = (options: { account?: boolean } = {}) => {
  const query = useActivePlanRaw(options)
  const plans = usePlans()
  const raw = query.data
  const tier = raw ? matchPlan(raw, plans.data ?? []) : undefined
  const data: ActivePlan | undefined = raw && { ...raw, name: tier?.name || raw.name, limits: { ...(tier?.limits ?? {}), ...raw.limits } }
  return { data, isLoading: query.isLoading, isError: query.isError, refetch: query.refetch }
}

/** Whether something is still allowed on this plan: a number limit (-1 = unlimited) against usage, or a yes/no. */
export const usePlanGate = (options: { account?: boolean } = {}) => {
  const plan = useActivePlan(options)
  const branch = useBranchSubscription()
  const data = plan.data
  const branchLocked = options.account ? false : branch.locked
  const limitOf = (field: PlanField) => data?.limits[field]
  return {
    loading: plan.isLoading,
    planName: data?.name ?? '',
    branchLocked,
    /** True once usage reaches a numeric limit; never blocks when either number is unknown. */
    atLimit: (field: CountField, current?: number) => {
      if (branchLocked) return true
      const limit = limitOf(field)
      if (typeof limit !== 'number' || limit < 0) return false
      const used = current ?? data?.usage[field]
      return typeof used === 'number' && used >= limit
    },
    limit: limitOf,
    /** Unknown (loading / failed / field missing) never blocks. */
    customDomain: branchLocked ? false : data ? (data.customDomainAllowed ?? (limitOf('custom_domain') !== false)) : true,
  }
}

export const useSubscribe = () => useMutation({
  mutationFn: async ({ planId, period, businessId }: { planId: string; period: BillingPeriod; businessId: string | null }) => {
    if (!isLive()) return mockDelay({ paymentUrl: '' })
    const raw = asRecord(await apiRequest<unknown>('user/subscribe/', { method: 'POST', body: { plan: Number(planId) || planId, duration: period, ...(businessId ? { business_id: businessId } : {}) } }))
    const paymentUrl = str(asRecord(raw.data).payment_url) || str(raw.payment_url)
    if (!paymentUrl) throw new Error('No payment link came back. Please try again.')
    return { paymentUrl }
  },
})
