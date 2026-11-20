import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { isLive } from '@/api/http'
import type { ManualShippingStatus } from '@/api/orders'
import { useRefreshTracking, useShipmentDetails, useUpdateShipmentStatus } from '@/api/shipments'
import { usePermissions } from '@/hooks/usePermissions'
import type { Shipment, ShipmentDetails } from '@/api/types'
import { useDisclosure } from '@/hooks/useDisclosure'
import { formatNaira } from '@/lib/format'
import { paths } from '@/routes/paths'
import { printReceipt } from '../printReceipt'
import { downloadReceipt, isCancelled, progressFor } from '../utils'
import { useBusinessDataStore } from '@/stores/business-data-store'

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

/** sink's ViewOrder status buttons for a manual order: Pending, Shipped, Delivered, Returned; any one can be picked. */
const MANUAL_OPTIONS: { value: ManualShippingStatus; label: string; hint: string }[] = [
  { value: 'PENDING', label: 'Pending', hint: 'Not sent out yet' },
  { value: 'SHIPPED', label: 'Shipped', hint: 'It has left with your rider' },
  { value: 'DELIVERED', label: 'Delivered', hint: 'The customer has it' },
  { value: 'RETURNED', label: 'Returned', hint: 'It came back to you' },
]

const DELIVERY_LABEL = { SHIPBUBBLE: 'Automated (Shipbubble)', 'IN-HOUSE': 'Your own delivery', PICKUP: 'Customer pickup' } as const

/**
 * Loads one order's address, products and progress for the drawer, plus the tracking refresh.
 * Orders not on Shipbubble (the business's own delivery or a pickup) are moved by hand, as in sink's
 * ViewOrder: Shipping, then Delivered, or Returned (PATCH order/change_shipping/{id}/?status=).
 * Shipbubble orders move on their own, so they get Refresh tracking instead.
 */
export function useOrderDetails(shipment: Shipment) {
  const detailsQuery = useShipmentDetails(shipment)
  const refreshMutation = useRefreshTracking()
  const statusMutation = useUpdateShipmentStatus()
  const { canUpdateShipping } = usePermissions()
  const businessName = useBusinessDataStore(state => state.businessData?.name) || 'Your business'
  const details = detailsQuery.data
  const current = details ?? shipment
  const deliveryType = current.deliveryType
  const automated = deliveryType === 'SHIPBUBBLE'
  const pickup = deliveryType === 'PICKUP'
  const inStore = current.channel === 'INSTORE'
  const cancelled = isCancelled(current.rawStatus)
  const returned = current.status === 'Returned'
  const [picked, setPicked] = useState<ManualShippingStatus | null>(null)
  const rawStatus = (current.rawStatus ?? '').toUpperCase()
  const currentManual = (['PENDING', 'SHIPPED', 'DELIVERED', 'RETURNED'] as const).find(value => value === rawStatus) ?? (rawStatus ? null : 'PENDING')

  // Manual orders have no rider timestamps: placed, then shipping (or ready to collect), then delivered/collected or returned.
  const manualStages = [
    { label: 'Order placed', detail: 'Payment and delivery details confirmed' },
    pickup ? { label: 'Ready to collect', detail: 'Waiting for the customer to pick it up' } : { label: 'Shipping', detail: 'On its way with your rider' },
    returned ? { label: 'Returned', detail: 'The order came back to you' } : { label: pickup ? 'Collected' : 'Delivered', detail: pickup ? `${shipment.customer} collected the order` : `Delivered to ${shipment.customer}` },
  ]
  const manualProgress = returned || current.status === 'Delivered' ? 3 : current.status === 'In transit' ? 2 : 1

  const progress = automated ? (cancelled ? 1 : details ? progressFromDetails(details) : progressFor(shipment.status)) : manualProgress
  const timeFor = (index: number) => (index < progress ? (isLive() ? 'Done' : SAMPLE_TIMES[index]) : 'Pending')

  const automatedStages = [
    { label: 'Order confirmed', detail: 'Payment and shipment details confirmed' },
    { label: 'Rider assigned', detail: `${shipment.carrier} accepted this delivery` },
    { label: 'In transit', detail: 'Package is on the way to the customer' },
    { label: cancelled ? 'Cancelled' : 'Delivered', detail: cancelled ? 'This delivery was cancelled' : `Package delivered to ${shipment.customer}` },
  ]
  const stages = (automated ? automatedStages : manualStages).map((stage, index) => ({ ...stage, time: timeFor(index) }))

  const saveStatus = () => {
    if (!picked || picked === currentManual) return
    const option = MANUAL_OPTIONS.find(item => item.value === picked)
    statusMutation.mutate({ orderId: shipment.orderId ?? shipment.id, status: picked }, {
      onSuccess: () => { toast.success(`Shipping status updated to ${(option?.label ?? 'the new status').toLowerCase()}`); setPicked(null) },
      onError: error => toast.error(errorMessage(error, 'Could not update the shipping status. Please try again.')),
    })
  }

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
    automated,
    /** sink's "Print Receipt": the receipt alone, sent to the printer. */
    print: () => {
      try { printReceipt({ shipment, details, businessName, deliveryMethod: deliveryType ? DELIVERY_LABEL[deliveryType] : inStore ? 'Sold in store' : 'Delivery' }) }
      catch { toast.error('Could not prepare the receipt for printing.') }
    },
    delivery: {
      method: deliveryType ? DELIVERY_LABEL[deliveryType] : inStore ? 'Sold in store' : 'Delivery',
      partner: automated ? current.carrier : '',
      fee: current.shippingFee ?? 0,
      feeLabel: current.shippingFee ? formatNaira(current.shippingFee) : pickup ? 'Free (pickup)' : 'Not set',
      amountPaid: current.amountPaid,
      total: current.amountValue,
    },
    manual: {
      /** sink: the buttons show for anyone who can manage orders, on orders that aren't Shipbubble or in-store. */
      show: !automated && !inStore && !cancelled && canUpdateShipping,
      options: MANUAL_OPTIONS,
      current: currentManual,
      picked: picked ?? currentManual,
      pick: setPicked,
      canSave: Boolean(picked && picked !== currentManual),
      save: saveStatus,
      saving: statusMutation.isPending,
    },
  }
}
