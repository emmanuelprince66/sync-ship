import { useCallback, useRef, useState } from 'react'
import { exportShipmentsCsv, useShipments, useShipmentStats } from '@/api/shipments'
import { formatNaira } from '@/lib/format'
import { useShipmentDrawer } from './useShipmentDrawer'
import { useShipmentFilters } from './useShipmentFilters'
import type { PaymentFilter } from '../utils'

export function useShipmentsPage(tracking: boolean) {
  const [payment, setPayment] = useState<PaymentFilter>('All payments')
  const shipmentsQuery = useShipments(payment === 'BNPL' ? { paymentMethod: 'BNPL' } : {})
  const { data: stats, isLoading: statsLoading } = useShipmentStats()
  const shipments = shipmentsQuery.data ?? []
  const filters = useShipmentFilters(shipments, tracking, payment)
  const drawer = useShipmentDrawer()
  const statusRef = useRef<HTMLSelectElement>(null)

  const statCards = stats ? [
    { label: 'Total shipments', value: stats.totalShipments.toLocaleString(), change: stats.deliverySpend > 0 ? `${formatNaira(stats.deliverySpend)} in fees` : undefined, icon: 'box' as const, color: '#4774C9' },
    { label: 'Total fulfilled', value: stats.fulfilled.toLocaleString(), change: stats.totalShipments > 0 ? `${((stats.fulfilled / stats.totalShipments) * 100).toFixed(1)}% success` : undefined, icon: 'check' as const, color: '#529661' },
    { label: 'Total pending', value: stats.pending.toLocaleString(), change: stats.pending > 0 ? 'Needs attention' : undefined, icon: 'clock' as const, color: '#D38A25' },
  ] : []

  return {
    title: tracking ? 'Track orders' : 'Shipping & tracking',
    subtitle: tracking ? 'Follow active pickups and deliveries in real time.' : 'Manage, track, and export every customer delivery.',
    isLoading: shipmentsQuery.isLoading,
    statCards,
    statsLoading,
    filters,
    payment,
    setPayment: (value: string) => setPayment(value as PaymentFilter),
    drawer,
    statusRef,
    focusStatusFilter: useCallback(() => statusRef.current?.focus(), []),
    exportCsv: () => exportShipmentsCsv(filters.filtered),
  }
}
