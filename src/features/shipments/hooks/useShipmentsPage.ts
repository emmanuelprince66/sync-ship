import { useCallback, useRef, useState } from 'react'
import { exportShipmentsCsv, useShipmentsPage as useShipmentsPageQuery, useShipmentStats } from '@/api/shipments'
import type { ShipmentStatus } from '@/api/types'
import { formatNaira } from '@/lib/format'
import { useShipmentDrawer } from './useShipmentDrawer'
import { useShipmentFilters } from './useShipmentFilters'
import type { PaymentFilter } from '../utils'

export function useShipmentsPage(tracking: boolean) {
  const [payment, setPayment] = useState<PaymentFilter>('All payments')
  // Paging like sink-inventory: page + rows per page, with search/status sent to the server.
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusTerm, setStatusTerm] = useState('All statuses')
  const shipmentsQuery = useShipmentsPageQuery({
    page,
    limit: pageSize,
    search: searchTerm.trim() || undefined,
    status: statusTerm === 'All statuses' ? undefined : (statusTerm as ShipmentStatus),
    paymentMethod: payment === 'BNPL' ? 'BNPL' : undefined,
  })
  const { data: stats, isLoading: statsLoading } = useShipmentStats()
  const shipments = shipmentsQuery.data?.shipments ?? []
  const filters = useShipmentFilters(shipments, tracking, payment)
  // Feed the debounced search/status back into the server query (and start again from page 1).
  if (filters.debouncedSearch !== searchTerm) { setSearchTerm(filters.debouncedSearch); setPage(1) }
  if (filters.status !== statusTerm) { setStatusTerm(filters.status); setPage(1) }
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
    setPayment: (value: string) => { setPayment(value as PaymentFilter); setPage(1) },
    pagination: { page, pages: shipmentsQuery.data?.pages ?? 1, pageSize, setPage, setPageSize: (size: number) => { setPageSize(size); setPage(1) } },
    drawer,
    statusRef,
    focusStatusFilter: useCallback(() => statusRef.current?.focus(), []),
    exportCsv: () => exportShipmentsCsv(filters.filtered),
  }
}
