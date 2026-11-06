import { useState } from 'react'
import { useNavigate } from 'react-router'
import { usePendingBnpl, type BnplStageFilter } from '@/api/bnpl'
import { formatNaira } from '@/lib/format'
import { settingsPath } from '@/routes/paths'

export const BNPL_STAGE_TABS: readonly { key: BnplStageFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'awaiting_settlement', label: 'Awaiting settlement' },
  { key: 'processing_payout', label: 'Processing payout' },
  { key: 'failed_retrying', label: 'Retrying' },
  { key: 'settled', label: 'Settled' },
]

export const BNPL_PAGE_SIZE = 10

/** yyyy-mm-dd, as the endpoint expects (sink: toISOString().slice(0, 10)). */
const asIsoDay = (value?: Date) => (value ? value.toISOString().slice(0, 10) : undefined)

/**
 * Pending Akawopay settlements (sink's PendingBnplPanel). "all" rather than no
 * stage, so settled payouts show on the tab that claims to show everything.
 * A new stage or date range re-pages from 1. The tiles answer whichever
 * question the open tab asks: settled money on "Settled", owed money otherwise.
 */
export function usePendingBnplPanel({ dateRange, startDate: startDay, endDate: endDay }: { dateRange?: { from?: Date; to?: Date }; startDate?: string; endDate?: string } = {}) {
  const startDate = asIsoDay(dateRange?.from) ?? startDay
  const endDate = asIsoDay(dateRange?.to) ?? endDay
  const navigate = useNavigate()
  const [stage, setStageState] = useState<BnplStageFilter>('all')
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState(true)
  // Re-page from 1 whenever the date range changes (render-time reset, no effect).
  const [rangeKey, setRangeKey] = useState(`${startDate}|${endDate}`)
  if (rangeKey !== `${startDate}|${endDate}`) { setRangeKey(`${startDate}|${endDate}`); setPage(1) }

  const query = usePendingBnpl({ stage, startDate: startDate || undefined, endDate: endDate || undefined, page, pageSize: BNPL_PAGE_SIZE })
  const summary = query.data?.summary
  const pendingCount = summary?.totalPendingOrders ?? 0
  const settledCount = summary?.totalSettledOrders ?? 0
  const showingSettled = stage === 'settled'
  const pages = query.data?.pages ?? 1

  const tiles = showingSettled
    ? [
        { label: 'Settled orders', value: String(settledCount), hint: 'Paid into your wallet' },
        { label: 'Settled gross', value: formatNaira(summary?.totalSettledGross ?? 0), hint: 'What customers were charged' },
        { label: 'Received', value: formatNaira(summary?.totalSettledNet ?? 0), hint: 'After Akawopay\'s fee', tone: 'positive' as const },
        { label: 'Fees paid', value: formatNaira(summary?.totalSettledFees ?? 0), hint: 'Gateway deduction', tone: 'negative' as const },
      ]
    : [
        { label: 'Pending orders', value: String(pendingCount), hint: 'Goods already released' },
        { label: 'Pending gross', value: formatNaira(summary?.totalPendingGross ?? 0), hint: 'What customers were charged' },
        { label: 'Expected in wallet', value: formatNaira(summary?.totalEstimatedNet ?? 0), hint: 'After Akawopay\'s fee', tone: 'positive' as const },
        { label: 'Fees', value: formatNaira(summary?.totalEstimatedFees ?? 0), hint: 'Gateway deduction', tone: 'negative' as const },
      ]

  return {
    expanded,
    toggleExpanded: () => setExpanded(open => !open),
    /** Shown on the collapsed header: the amount owed. */
    headline: query.isLoading || query.isError ? null : { owed: formatNaira(summary?.totalEstimatedNet ?? 0), pending: `${pendingCount} pending` },
    tiles,
    tabs: BNPL_STAGE_TABS.map(tab => ({
      ...tab,
      // Counts come off the breakdown, totalled over the whole date range, so one tab doesn't zero the others.
      count: tab.key === 'all' ? (summary ? pendingCount + settledCount : undefined) : summary?.breakdown[tab.key]?.count,
    })),
    stage,
    setStage: (next: BnplStageFilter) => { setStageState(next); setPage(1) },
    orders: query.data?.results ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    isFetching: query.isFetching,
    retry: () => { void query.refetch() },
    page,
    pages,
    canPrev: page > 1,
    canNext: page < pages,
    prev: () => setPage(current => Math.max(current - 1, 1)),
    next: () => setPage(current => Math.min(current + 1, pages)),
    goToSettings: () => navigate(settingsPath('Storefront')),
  }
}
