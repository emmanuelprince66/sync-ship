import { useNavigate } from 'react-router'
import { useShipments, useShipmentStats } from '@/api/shipments'
import { useWallet } from '@/api/wallet'
import { formatNaira } from '@/lib/format'
import { paths, settingsPath } from '@/routes/paths'
import { useShipmentDrawer } from '@/features/shipments/hooks/useShipmentDrawer'
import { useSetupProgress } from '@/features/onboarding/useSetupProgress'

export function useDashboard() {
  const navigate = useNavigate()
  const shipmentsQuery = useShipments()
  const { data: stats, isLoading: statsLoading } = useShipmentStats()
  const { data: wallet, isLoading: walletLoading } = useWallet()
  const drawer = useShipmentDrawer()
  const setup = useSetupProgress()
  const nextStep = setup.steps.find(step => !step.done)

  const statCards = stats ? [
    // Chips only carry real figures from the same data; the backend has no period-over-period trend.
    { label: 'Total shipments', value: stats.totalShipments.toLocaleString(), change: stats.pending > 0 ? `${stats.pending.toLocaleString()} pending` : undefined, icon: 'box' as const, color: '#529661' },
    { label: 'In transit', value: stats.inTransit.toLocaleString(), icon: 'truck' as const, color: '#4774C9' },
    { label: 'Delivered this month', value: stats.deliveredThisMonth.toLocaleString(), icon: 'check' as const, color: '#8B63B6' },
    { label: 'Delivery spend', value: formatNaira(stats.deliverySpend), icon: 'wallet' as const, color: '#D38A25' },
  ] : []

  return {
    shipments: shipmentsQuery.data ?? [],
    shipmentsLoading: shipmentsQuery.isLoading,
    statCards,
    statsLoading,
    walletLoading,
    /** Whole-naira part, e.g. "₦184,350" — the design renders ".00" separately. */
    walletBalance: wallet ? formatNaira(Math.floor(wallet.balance)) : '₦0',
    walletKobo: wallet ? `.${String(Math.round((wallet.balance % 1) * 100)).padStart(2, '0')}` : '.00',
    drawer,
    createShipment: () => navigate(paths.createShipment),
    viewShipments: () => navigate(paths.shipments),
    withdraw: () => navigate(paths.withdraw),
    fundWallet: () => navigate(paths.fundWallet),
    setup: { completed: setup.completed, total: setup.total, percent: setup.percent, loading: setup.isLoading, done: !nextStep, nextLabel: nextStep?.title ?? '' },
    continueSetup: () => navigate(settingsPath(setup.nextSection)),
  }
}
