import { useMemo, useState } from 'react'
import type { Shipment } from '@/api/types'
import { useDebounce } from '@/hooks/useDebounce'
import { ACTIVE_STATUSES, isBnplShipment, type PaymentFilter, type StatusFilter } from '../utils'

/** Search (id, customer, destination) + status + payment-method filter. Tracking mode keeps only active deliveries. */
export function useShipmentFilters(shipments: Shipment[], tracking: boolean, payment: PaymentFilter) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('All statuses')

  const debouncedSearch = useDebounce(search)

  const filtered = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase()
    return shipments.filter(shipment =>
      (!tracking || ACTIVE_STATUSES.includes(shipment.status))
      && (status === 'All statuses' || shipment.status === status)
      && (payment === 'All payments' || isBnplShipment(shipment))
      && (!query || [shipment.id, shipment.customer, shipment.destination].some(value => value.toLowerCase().includes(query))))
  }, [shipments, tracking, status, payment, debouncedSearch])

  return { search, setSearch, status, setStatus: (value: string) => setStatus(value as StatusFilter), filtered }
}
