import { useMemo } from 'react'
import type { Shipment } from '@/api/types'
import { buildShipmentColumns } from '../components/shipmentColumns'

export function useShipmentColumns(onView?: (shipment: Shipment) => void) {
  return useMemo(() => buildShipmentColumns(onView), [onView])
}
