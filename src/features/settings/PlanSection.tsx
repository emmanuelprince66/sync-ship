import { useRef, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { BILLING_PERIODS, SHIP_PLAN_FEATURES, SHIP_UNLIMITED_FEATURES, matchPlan, useActivePlan, useBranchSubscription, usePlans, useSubscribe, type BillingPeriod, type Plan } from '@/api/plan'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Skeleton } from '@/components/ui/Skeleton'
import { usePermissions } from '@/hooks/usePermissions'
import { cn } from '@/lib/cn'
import { formatNaira } from '@/lib/format'
import { SectionHeading } from './shared'

/** -1 = unlimited (∞), missing = "—". */
const countLabel = (value: number | null | undefined) =>
  value === undefined || value === null ? '—' : value < 0 ? '∞' : value.toLocaleString()

const valueLabel = (value: number | boolean | undefined) =>
  typeof value === 'boolean' ? (value ? 'Included' : 'Not included') : countLabel(value)

const money = (value: number) => `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const DURATION_LABELS: Record<string, string> = { ANNUAL: 'annual', MONTHLY: 'monthly', QUARTERLY: 'quarterly', BIANNUAL: '6 months' }

function LoadError({ label, onRetry }: { label: string; onRetry: () => void }) {
  return <div className="rounded-2xl border border-[#E2E9E5] px-4 py-8 text-center text-xs text-[#7D8E85]">We couldn’t load {label}. <button type="button" onClick={onRetry} className="font-extrabold text-[#438352]">Try again</button></div>
}

function Stat({ label, value, loading }: { label: string; value: ReactNode; loading: boolean }) {
  return <div className="min-w-0 rounded-2xl bg-[#F3F7F4] p-4">
    <div className="truncate text-[10px] text-[#829189]">{label}</div>
    {loading ? <Skeleton className="mt-1.5 h-5 w-16"/> : <div className="mt-1 truncate text-lg font-black text-[#17382C]">{value}</div>}
  </div>
}

/** "used / limit", with a bar only when both are real numbers and the limit is finite. */
function Usage({ label, used, limit, loading }: { label: string; used: number | null; limit: number | null; loading: boolean }) {
  const pct = used !== null && limit !== null && limit > 0 ? Math.min(100, (used / limit) * 100) : 0
  return <div className="min-w-0 rounded-2xl border border-[#E2E9E5] p-4">
    <div className="flex min-w-0 items-center justify-between gap-3">
      <span className="truncate text-[11px] font-bold text-[#5F7268]">{label}</span>
      {loading ? <Skeleton className="h-4 w-16"/> : <span className="shrink-0 text-sm font-black text-[#09261C]">{countLabel(used)} / {countLabel(limit)}</span>}
    </div>
    <span className="mt-2.5 block h-1.5 overflow-hidden rounded-full bg-[#E4ECE7]"><span className={cn('block h-full rounded-full', pct >= 100 ? 'bg-[#D15B50]' : pct >= 80 ? 'bg-[#D99A24]' : 'bg-[#529661]')} style={{ width: `${pct}%` }}/></span>
  </div>
}

/** Settings → Plan & billing: the current plan as sink's Premium screen shows it, every tier side by side, and upgrading. */
export function PlanSection() {
  const [searchParams] = useSearchParams()
  const customDomainUpgrade = searchParams.get('upgrade') === 'custom-domain'
  const plans = usePlans()
  const active = useActivePlan()
  const branch = useBranchSubscription()
  const subscribe = useSubscribe()
  const { isSuperAdmin } = usePermissions()
  const [period, setPeriod] = useState<BillingPeriod>('MONTHLY')
  const [choosing, setChoosing] = useState('')
  const plansRef = useRef<HTMLDivElement>(null)
  const billing = BILLING_PERIODS.find(item => item.value === period) ?? BILLING_PERIODS[0]
  const current = active.data
  const summary = current?.summary
  const allPlans = plans.data ?? []
  const plusIndex = allPlans.findIndex(plan => plan.name.toLowerCase().replace(/[^a-z0-9]/g, '') === 'syncplus')
  const upgradePlans = plusIndex >= 0
    ? allPlans.slice(plusIndex)
    : allPlans.filter(plan => plan.limits.custom_domain === true || (typeof plan.limits.custom_domain === 'number' && plan.limits.custom_domain > 0))
  const visiblePlans = customDomainUpgrade ? upgradePlans : allPlans
  // active_plan carries no plan name: only a tier matched by its limits names it.
  const planName = current ? matchPlan(current, plans.data ?? [])?.name ?? '' : ''
  const loading = active.isLoading
  const rawDuration = summary?.duration ?? ''
  const duration = DURATION_LABELS[rawDuration.toUpperCase()] ?? rawDuration.toLowerCase()

  const choose = (plan: Plan) => {
    setChoosing(plan.id)
    subscribe.mutate({ planId: plan.id, period, businessId: branch.planBusinessId }, {
      onSuccess: ({ paymentUrl }) => { if (paymentUrl) window.location.href = paymentUrl; else toast.success(`${plan.name} selected (sample mode, no payment taken)`) },
      onError: error => toast.error(errorMessage(error, 'Could not start the subscription.')),
      onSettled: () => setChoosing(''),
    })
  }

  return <>
    <SectionHeading title="Plan & billing" description="Your current plan, what it includes, and upgrades. One subscription covers all your Sync360 apps."/>

    {branch.locked && <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#F1DFB4] bg-[#FFF7E6] p-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-[#8D681D]"><Icon name="lock" size={16}/></span>
      <div className="min-w-0"><div className="text-xs font-extrabold text-[#6E5115]">{branch.branchName || 'This branch'} needs its own plan</div><div className="mt-1 text-[10px] leading-4 text-[#927A48]">Only your first business is covered by your account plan. Choose a plan below to unlock attendants and a custom domain for this branch.</div></div>
    </div>}

    {/* Current plan: active_plan's own fields, shown as sink shows them (-1 = ∞, missing = —) */}
    <div className="mt-6 rounded-2xl border border-[#E2E9E5] p-4 sm:p-5">
      {active.isError ? <LoadError label="your plan" onRetry={() => void active.refetch()}/> : <>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#09261C] text-[#C9E9CC]"><Icon name="crown" size={20}/></span>
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-2"><span className="text-[10px] font-bold text-[#829189]">{branch.planBusinessId ? 'This branch’s plan' : 'Current plan'}</span><span className="rounded-full bg-[#EAF5E9] px-2 py-0.5 text-[9px] font-extrabold text-[#438352]">Active</span>{planName && <span className="truncate text-[10px] font-extrabold text-[#17382C]">{planName}</span>}</div>
              {loading ? <Skeleton className="mt-1.5 h-6 w-32"/> : <div className="mt-0.5 flex min-w-0 flex-wrap items-baseline gap-1"><span className="text-xl font-black text-[#09261C]">{money(summary?.amount ?? 0)}</span>{duration && <span className="text-[11px] font-bold text-[#829189]">/ {duration}</span>}</div>}
              <div className="mt-1 flex min-w-0 items-center gap-1 text-[11px] text-[#6C7E75]"><span className="shrink-0">Renewal date:</span>{loading ? <Skeleton className="h-3 w-20"/> : <span className="truncate font-extrabold text-[#304B40]">{summary?.endDate || '—'}</span>}</div>
            </div>
          </div>
          <Button variant="outline" className="shrink-0" onClick={() => plansRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>View plans</Button>
        </div>

        <div className="mt-5 grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3 sm:grid-cols-[repeat(3,minmax(0,1fr))] lg:grid-cols-[repeat(5,minmax(0,1fr))]">
          <Stat label="Users" value={countLabel(summary?.customerCount)} loading={loading}/>
          <Stat label="Businesses" value={countLabel(summary?.businesses ?? 0)} loading={loading}/>
          <Stat label="Attendants" value={countLabel(summary?.attendants ?? 0)} loading={loading}/>
          <Stat label="Inventory limit" value={countLabel(summary?.inventoryLimit)} loading={loading}/>
          <Stat label="Customer limit" value={countLabel(summary?.customerLimit)} loading={loading}/>
        </div>

        <div className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-[repeat(2,minmax(0,1fr))]">
          <Usage label="Inventory used" used={summary?.inventoryCount ?? null} limit={summary?.inventoryLimit ?? null} loading={loading}/>
          <Usage label="Customers added" used={summary?.customerCount ?? null} limit={summary?.customerLimit ?? null} loading={loading}/>
        </div>
        <p className="mt-4 text-[10px] leading-4 text-[#829189]">{SHIP_UNLIMITED_FEATURES.join(', ')}: unlimited on every plan.</p>
      </>}
    </div>

    {/* Plans */}
    <div ref={plansRef} className="mt-6 scroll-mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><div className="text-sm font-black text-[#17382C]">Plans</div><div className="mt-0.5 text-[10px] text-[#84938C]">Pick a billing period, then choose a plan to pay securely.</div></div>
        <div className="flex max-w-full gap-1 overflow-x-auto rounded-xl bg-[#EAF1EC] p-1 [scrollbar-width:none]" role="tablist" aria-label="Billing period">{BILLING_PERIODS.map(item => <button key={item.value} type="button" role="tab" aria-selected={period === item.value} onClick={() => setPeriod(item.value)} className={cn('shrink-0 rounded-lg px-3 py-2 text-xs font-extrabold transition sm:px-4', period === item.value ? 'bg-white text-[#09261C] shadow-sm' : 'text-[#718279]')}>{item.label}</button>)}</div>
      </div>
      {customDomainUpgrade && <p className="mt-3 rounded-xl bg-[#F4F8F5] p-3 text-[10px] text-[#687A71]">Choose a Sync Plus plan or higher to unlock your custom domain.</p>}
      {!isSuperAdmin && <p className="mt-3 rounded-xl bg-[#F4F8F5] p-3 text-[10px] text-[#687A71]">Only the business owner or an admin can change the plan.</p>}
      {plans.isError ? <div className="mt-4"><LoadError label="the plans" onRetry={() => void plans.refetch()}/></div>
        : plans.isLoading ? <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-72 rounded-2xl"/>)}</div>
          : visiblePlans.length === 0 ? <div className="mt-4 rounded-2xl border border-dashed border-[#C9D8CF] p-6 text-center text-xs text-[#7D8E85]">No plans with custom domains are currently available.</div>
          : <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2 xl:grid-cols-3">{visiblePlans.map(plan => {
            const isCurrent = Boolean(planName) && plan.name.toLowerCase() === planName.toLowerCase()
            const price = plan.prices[billing.priceKey] ?? 0
            const ownPlan = isCurrent && !branch.locked
            return <div key={plan.id} className={cn('flex min-w-0 flex-col rounded-2xl border p-5', isCurrent ? 'border-[#529661] bg-[#F4FAF4]' : 'border-[#E2E9E5]')}>
              <div className="flex items-center justify-between gap-2"><span className="truncate text-sm font-black text-[#17382C]">{plan.name}</span>{isCurrent && <span className="shrink-0 rounded-full bg-[#529661] px-2 py-0.5 text-[9px] font-extrabold text-white">Current</span>}</div>
              <div className="mt-3 text-2xl font-black text-[#09261C]">{price > 0 ? formatNaira(price) : 'Free'}{price > 0 && <span className="text-[11px] font-bold text-[#829189]"> / {billing.label.toLowerCase()}</span>}</div>
              <ul className="mt-4 flex flex-1 flex-col gap-2">
                {SHIP_PLAN_FEATURES.map(({ field, label }) => {
                  const value = plan.limits[field]
                  const unknown = value === undefined
                  const off = value === false || value === 0
                  return <li key={field} className="flex min-w-0 items-center gap-2 text-[11px] font-semibold text-[#405B50]"><span className={unknown || off ? 'text-[#C3D0C9]' : 'text-[#529661]'}><Icon name={unknown ? 'minus' : off ? 'close' : 'check'} size={14}/></span><span className={cn('min-w-0', off && 'text-[#A9B7B0]')}>{label}: {valueLabel(value)}</span></li>
                })}
                {SHIP_UNLIMITED_FEATURES.map(label => <li key={label} className="flex min-w-0 items-center gap-2 text-[11px] font-semibold text-[#405B50]"><span className="text-[#529661]"><Icon name="check" size={14}/></span><span className="min-w-0">{label}: ∞</span></li>)}
              </ul>
              <Button variant={ownPlan || price <= 0 ? 'outline' : 'primary'} onClick={() => choose(plan)} disabled={!isSuperAdmin || ownPlan || price <= 0 || Boolean(choosing && choosing !== plan.id)} loading={choosing === plan.id} className="mt-5 w-full">{ownPlan ? 'Your plan' : price <= 0 ? 'Free plan' : `Choose ${plan.name}`}</Button>
            </div>
          })}</div>}
    </div>
  </>
}
