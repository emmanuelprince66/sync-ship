import { useMemo, useState } from 'react'
import type { Shipment } from '@/api/types'
import { useDebounce } from '@/hooks/useDebounce'
import { ACTIVE_STATUSES, type StatusFilter } from '../utils'

/** Search (id, customer, destination) + status filter. Tracking mode keeps only active deliveries. */
export function useShipmentFilters(shipments: Shipment[], tracking: boolean) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('All statuses')

  const debouncedSearch = useDebounce(search)

  const filtered = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase()
    return shipments.filter(shipment =>
      (!tracking || ACTIVE_STATUSES.includes(shipment.status))
      && (status === 'All statuses' || shipment.status === status)
      && (!query || [shipment.id, shipment.customer, shipment.destination].some(value => value.toLowerCase().includes(query))))
  }, [shipments, tracking, status, debouncedSearch])

  return { search, setSearch, status, setStatus: (value: string) => setStatus(value as StatusFilter), filtered }
}
