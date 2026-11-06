import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { isLive } from '@/api/http'
import { useRefreshTracking, useShipmentDetails } from '@/api/shipments'
import type { Shipment, ShipmentDetails } from '@/api/types'
import { useDisclosure } from '@/hooks/useDisclosure'
import { formatNaira } from '@/lib/format'
import { paths } from '@/routes/paths'
import { downloadReceipt, isCancelled, progressFor } from '../utils'

/** Open/close state and actions for the order details drawer. */
export function useShipmentDrawer() {
  const navigate = useNavigate()
  const { isOpen, open: openDrawer, close } = useDisclosure()
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const open = useCallback((value: Shipment) => { setShipment(value); openDrawer() }, [openDrawer])
  const trackLive = useCallback(() => { close(); navigate(paths.tracking) }, [close, navigate])
  const receipt = useCallback(() => { if (shipment) downloadReceipt(shipment) }, [shipment])
  return { selected: isOpen ? shipment : null, open, close, trackLive, downloadReceipt: receipt }
}

/** 1 = confirmed, 2 = rider assigned, 3 = picked up / on the way, 4 = delivered. */
const progressFromDetails = ({ progress }: ShipmentDetails) =>
  progress.delivered ? 4 : progress.pickedUp || progress.outForDelivery ? 3 : progress.riderAssigned ? 2 : 1

// The sample data has fixed stage times; the backend doesn't return them, so live mode shows "Done".
const SAMPLE_TIMES = ['10:24 AM', '10:31 AM', '11:08 AM', '12:42 PM']

/** Loads one order's address, products and progress for the drawer, plus the tracking refresh. */
export function useOrderDetails(shipment: Shipment) {
  const detailsQuery = useShipmentDetails(shipment)
  const refreshMutation = useRefreshTracking()
  const details = detailsQuery.data
  const cancelled = isCancelled(details?.rawStatus ?? shipment.rawStatus)
  const progress = cancelled ? 1 : details ? progressFromDetails(details) : progressFor(shipment.status)
  const timeFor = (index: number) => (index < progress ? (isLive() ? 'Done' : SAMPLE_TIMES[index]) : 'Pending')

  const stages = [
    { label: 'Order confirmed', detail: 'Payment and shipment details confirmed' },
    { label: 'Rider assigned', detail: `${shipment.carrier} accepted this delivery` },
    { label: 'In transit', detail: 'Package is on the way to the customer' },
    { label: cancelled ? 'Cancelled' : 'Delivered', detail: cancelled ? 'This delivery was cancelled' : `Package delivered to ${shipment.customer}` },
  ].map((stage, index) => ({ ...stage, time: timeFor(index) }))

  const refreshTracking = () =>
    refreshMutation.mutate(shipment.orderId ?? shipment.id, {
      onSuccess: () => toast.success('Tracking updated'),
      onError: error => toast.error(errorMessage(error, 'Could not refresh tracking. Please try again.')),
    })

  return {
    loading: detailsQuery.isLoading,
    progress,
    stages,
    address: details?.address || shipment.destination,
    phone: details?.customerPhone ?? shipment.customerPhone ?? '',
    email: details?.customerEmail ?? shipment.customerEmail ?? '',
    packageLines: (details?.products ?? []).map((product, index) => ({
      key: `${product.name}-${index}`,
      name: product.name || 'Item',
      meta: `${product.quantity} item${product.quantity === 1 ? '' : 's'}`,
      amount: formatNaira(product.price * product.quantity),
    })),
    refreshTracking,
    refreshing: refreshMutation.isPending,
  }
}
