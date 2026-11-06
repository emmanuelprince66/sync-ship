import type { Shipment, ShipmentStatus } from '@/api/types'

export const STATUS_FILTER_OPTIONS = ['All statuses', 'In transit', 'Delivered', 'Awaiting pickup', 'Pending payment'] as const
export type StatusFilter = typeof STATUS_FILTER_OPTIONS[number]

export const ACTIVE_STATUSES: ShipmentStatus[] = ['In transit', 'Awaiting pickup']

/** 1 = confirmed, 2 = rider assigned, 3 = in transit, 4 = delivered. */
export const progressFor = (status: ShipmentStatus) =>
  status === 'Delivered' ? 4 : status === 'In transit' ? 3 : status === 'Awaiting pickup' ? 2 : 1

/** Saves a plain-text receipt for one shipment. */
export const downloadReceipt = (shipment: Shipment) => {
  const text = [
    'SyncShip delivery receipt',
    `Shipment: ${shipment.id}`,
    `Date: ${shipment.date}`,
    `Customer: ${shipment.customer}`,
    `Destination: ${shipment.destination}`,
    `Delivery partner: ${shipment.carrier}`,
    `Status: ${shipment.status}`,
    `Amount: ${shipment.amount}`,
  ].join('\n')
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `syncship-receipt-${shipment.id}.txt`
  anchor.click()
  URL.revokeObjectURL(url)
}

/** "18 Admiralty Way, Lekki Phase 1, Lagos" → "Admiralty Way, Lekki Phase 1". */
export const shortAddress = (address: string) =>
  address.split(',').slice(0, 2).map(part => part.trim()).join(', ').replace(/^\d+\s*/, '')

export const isCancelled = (rawStatus?: string) => rawStatus?.toUpperCase() === 'CANCELLED'
