import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { mockDelay } from '@/lib/api-client'
import { formatNaira } from '@/lib/format'
import { useCurrentBusinessId } from './business'
import { isLive } from './http'
import { db } from './mock-data'
import { bookShipment, createInhouseOrder, fetchBoxSizes, fetchOrderDetails, fetchOrders, fetchShipmentRates, fetchShippingCategories, markOrderPaid, refreshTracking, updateShippingStatus, type InhouseDelivery, type OrderPayment, type OrdersPage, type OrdersQuery } from './orders'
import { queryKeys } from './query-keys'
import type { BoxSize, CreateShipmentInput, CreateShipmentResult, Shipment, ShipmentDetails } from './types'

/**
 * Shipments = Sync360 orders. Live mode reads/books through the backend
 * (see ./orders.ts); mock mode (VITE_AUTH_MODE=mock) serves the design's sample data.
 */

/** Sum of item value × quantity, as the design computes the products total. */
export const packageTotal = (products: CreateShipmentInput['products']) =>
  products.reduce((sum, item) => sum + (Number(item.amount) || 0) * (Number(item.quantity) || 1), 0)

// ─── Sample-data services ───────────────────────────────────────────────────

const getMockOrders = ({ search, status, paymentMethod }: OrdersQuery = {}): Promise<OrdersPage> => {
  const term = search?.trim().toLowerCase()
  const shipments = db.shipments.filter(shipment =>
    (!status || shipment.status === status) &&
    (paymentMethod !== 'BNPL' || shipment.paymentType?.toUpperCase() === 'BNPL' || Boolean(shipment.bnplStatus)) &&
    (!term || [shipment.id, shipment.customer, shipment.destination].some(value => value.toLowerCase().includes(term))))
  return mockDelay({ shipments, stats: { ...db.stats }, total: shipments.length, pages: 1 })
}

const createMockShipment = async (input: CreateShipmentInput): Promise<CreateShipmentResult> => {
  const partner = db.partners.find(item => item.id === input.partnerId) ?? db.partners[0]
  const merchant = input.method === 'merchant'
  const total = packageTotal(input.products)
  const shipment: Shipment = {
    id: `SH-${28452 + Math.floor(Math.random() * 20)}`,
    customer: merchant ? input.customer.name : 'Customer checkout',
    destination: merchant ? input.customer.city || 'Lekki, Lagos' : 'Address pending',
    carrier: merchant ? partner.full : 'Customer selects',
    status: merchant ? 'Awaiting pickup' : 'Pending payment',
    amount: formatNaira(merchant ? partner.price : total + partner.price),
    date: 'Just now',
  }
  db.shipments = [shipment, ...db.shipments]
  if (merchant && input.paymentMethod === 'wallet') db.wallet.balance -= partner.price
  return mockDelay({ shipment, checkoutLink: merchant ? undefined : 'pay.syncship.africa/kemi-store/ck-8F21A' }, 700)
}

// ─── Lists & stats ──────────────────────────────────────────────────────────

/** Shared orders query; useShipments and useShipmentStats select from it. */
const useOrdersQuery = <T>(query: OrdersQuery, select: (page: OrdersPage) => T) => {
  const { businessId } = useCurrentBusinessId()
  const live = isLive()
  return useQuery({
    queryKey: [...queryKeys.shipments, live ? businessId : 'mock', query],
    queryFn: () => (live ? fetchOrders(businessId as string, query) : getMockOrders(query)),
    enabled: !live || Boolean(businessId),
    placeholderData: keepPreviousData,
    select,
  })
}

/** Shipments list. Optional server-side search/status filter (live) or local filter (mock). */
export const useShipments = (query: OrdersQuery = {}) => useOrdersQuery(query, page => page.shipments)

/** One page of shipments plus paging info (server-side page/limit/search/status). */
export const useShipmentsPage = (query: OrdersQuery) => useOrdersQuery(query, page => ({ shipments: page.shipments, pages: Math.max(page.pages, 1), total: page.total }))

/** Totals for the stat cards. Live values come from the orders endpoint's summary. */
export const useShipmentStats = () => useOrdersQuery({}, page => page.stats)

/** Single order with delivery progress and products (live). Mock returns the list row with sample details. */
export const useShipmentDetails = (shipment: Shipment | null) =>
  useQuery({
    queryKey: [...queryKeys.shipment, shipment?.orderId ?? shipment?.id],
    queryFn: (): Promise<ShipmentDetails> => {
      if (isLive() && shipment?.orderId) return fetchOrderDetails(shipment.orderId)
      const current = shipment as Shipment
      return mockDelay({
        ...current,
        address: current.destination,
        // Sample product only in mock mode; a live row without an order id has no product data to show.
        products: isLive() ? [] : [{ name: 'Classic leather handbag', quantity: 1, price: 48000 }],
        progress: { riderAssigned: current.status !== 'Pending payment', pickedUp: current.status === 'In transit' || current.status === 'Delivered', outForDelivery: current.status === 'In transit' || current.status === 'Delivered', delivered: current.status === 'Delivered' },
      }, 200)
    },
    enabled: Boolean(shipment),
  })

const useInvalidateShipments = () => {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.shipments })
    queryClient.invalidateQueries({ queryKey: queryKeys.shipment })
  }
}

/** POST order/track_shipment/{id}/ — pulls the latest Shipbubble status. Pass Shipment.orderId. */
export const useRefreshTracking = () => {
  const invalidate = useInvalidateShipments()
  return useMutation({ mutationFn: (orderId: string) => (isLive() ? refreshTracking(orderId) : mockDelay(null)), onSuccess: invalidate })
}

/** PATCH order/change_shipping/{id}/?status= — manual status change (PENDING | SHIPPED | DELIVERED). */
export const useUpdateShipmentStatus = () => {
  const invalidate = useInvalidateShipments()
  return useMutation({ mutationFn: (input: Parameters<typeof updateShippingStatus>[0]) => (isLive() ? updateShippingStatus(input) : mockDelay(null)), onSuccess: invalidate })
}

// ─── Rates & booking ────────────────────────────────────────────────────────

const getMockPartners = () => mockDelay([...db.partners])

/**
 * Sample partner list for mock mode only. Live rates come from useShipmentRates
 * (Shipbubble quote for the actual route), so live mode returns no static list.
 */
export const useDeliveryPartners = () =>
  useQuery({ queryKey: [...queryKeys.partners, isLive() ? 'live' : 'mock'], queryFn: () => (isLive() ? Promise.resolve([]) : getMockPartners()) })

/**
 * Live courier quotes: POST order/fetch_shipment_rate/{business_id}/.
 * Needs catalog products (PackageItem.productId) and a full address with email + state.
 * Returns { reference, requestToken, rates } — pass the whole object back as
 * CreateShipmentInput.quote and use a rate's `id` as partnerId to book.
 * In mock mode it resolves to the sample partners.
 */
export const useShipmentRates = () =>
  useMutation({
    mutationFn: (input: Parameters<typeof fetchShipmentRates>[0]) =>
      isLive() ? fetchShipmentRates(input) : mockDelay({ reference: 'mock-reference', requestToken: 'mock-token', rates: [...db.partners] }),
  })

/** True when every line can be quoted live (all came from catalog products). */
export const canQuoteLive = (products: CreateShipmentInput['products']) =>
  isLive() && products.length > 0 && products.every(product => Boolean(product.productId))

export type CreateOrderInput = CreateShipmentInput & {
  /** What the customer has already paid (UNPAID / PARTIAL / PAID + method, bank, amount). */
  payment: OrderPayment
  /** Set when Shipbubble isn't active: the business's own delivery rate (create_order_inhouse). */
  inhouse?: InhouseDelivery
}

/**
 * Creates the order exactly like sink-inventory's order form:
 *  · Shipbubble active → create_order_shipbubble on the quote (channel OUTSTORE)
 *  · otherwise         → create_order_inhouse with the chosen delivery rate (shipping_id)
 * The customer record is created first when there's no customerId. Mock mode uses sample data.
 * Customer checkout links don't come through here: the customer's storefront checkout creates that order.
 */
const createShipment = async ({ payment, inhouse, ...input }: CreateOrderInput): Promise<CreateShipmentResult> => {
  if (!isLive()) return createMockShipment(input)
  if (inhouse) return { shipment: await createInhouseOrder({ ...input, delivery: inhouse, payment }) }
  if (!input.quote || input.quote.reference === 'mock-reference') throw new Error('Get live delivery rates (step 3) before booking.')
  return { shipment: await bookShipment({ ...input, quote: input.quote }, payment) }
}

export const useCreateShipment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createShipment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shipments })
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet })
    },
  })
}

/** PATCH order/mark-paid/{order_id}/ — record a payment on an existing order (sink's Update payment). */
export const useMarkOrderPaid = () => {
  const invalidate = useInvalidateShipments()
  return useMutation({ mutationFn: (input: Parameters<typeof markOrderPaid>[0]) => (isLive() ? markOrderPaid(input) : mockDelay(null)), onSuccess: invalidate })
}

// ─── Reference data (read-only) ─────────────────────────────────────────────

const ONE_HOUR = 60 * 60 * 1000

const MOCK_BOX_SIZES: BoxSize[] = [
  { name: 'Envelope', imageUrl: '', height: 2, width: 25, length: 35, maxWeight: 0.5 },
  { name: 'Small box', imageUrl: '', height: 10, width: 20, length: 25, maxWeight: 2 },
  { name: 'Medium box', imageUrl: '', height: 20, width: 30, length: 40, maxWeight: 5 },
  { name: 'Large box', imageUrl: '', height: 35, width: 45, length: 55, maxWeight: 15 },
]

/** GET order/shipping_dimention/ — Shipbubble box presets (sample sizes in mock mode). */
export const useBoxSizes = () =>
  useQuery({ queryKey: queryKeys.boxSizes, queryFn: () => (isLive() ? fetchBoxSizes() : mockDelay(MOCK_BOX_SIZES)), staleTime: ONE_HOUR })

/** GET order/shipping_category/ — Shipbubble item categories. Empty in mock mode. */
export const useShippingCategories = () =>
  useQuery({ queryKey: queryKeys.shippingCategories, queryFn: () => (isLive() ? fetchShippingCategories() : mockDelay([])), staleTime: ONE_HOUR })

/** Downloads the shipments as CSV, exactly as the design's "Export CSV" does. */
export const exportShipmentsCsv = (shipments: Shipment[]) => {
  const rows = [
    ['Shipment ID', 'Customer', 'Destination', 'Delivery partner', 'Status', 'Amount', 'Date'],
    ...shipments.map(shipment => [shipment.id, shipment.customer, shipment.destination, shipment.carrier, shipment.status, shipment.amount, shipment.date]),
  ]
  const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'syncship-shipping-report.csv'
  anchor.click()
  URL.revokeObjectURL(url)
}
