/**
 * Live Sync360 order/shipping services (same backend paths sink-inventory proxies):
 *  GET   order/orders/{business_id}/all?page&limit&search&shipping_status  → { results: { data, total_orders, completed_orders, total_revenue } }
 *  GET   order/single/{order_id}/
 *  POST  order/track_shipment/{order_id}/                                  (refresh Shipbubble tracking)
 *  PATCH order/change_shipping/{order_id}/?status=PENDING|SHIPPED|DELIVERED
 *  POST  order/fetch_shipment_rate/{business_id}/                          { products, address, note } → { reference, request_token, couriers }
 *  POST  order/business/create_order_shipbubble/{reference}/               { customer, payment_status, payment_method?, bank?, amount_paid?, request_token, service_code, courier_id, channel }
 *  POST  order/business/create_order_inhouse/{business_id}/                { products, address, shipping_date?, note?, customer, payment_status, payment_method?, bank?, amount_paid?, shipping_id }
 *  PATCH order/mark-paid/{order_id}/                                       { status, amount?, method?: BANK|CASH, bank? }
 *  POST  customer/{business_id}/                                           { name, phone, email }
 *  GET   order/shipping_dimention/  ·  GET order/shipping_category/
 */
import { apiRequest } from '@/lib/api-client'
import { formatNaira } from '@/lib/format'
import { requireBusinessId } from './business'
import { asRecord, at, formatActivityDate, listFrom, num, str } from './http'
import type { BoxSize, CreateShipmentInput, DeliveryPartner, DashboardStats, RateQuote, RateRequestInput, Shipment, ShipmentDetails, ShipmentStatus, ShippingCategory } from './types'

export type OrderPaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID'
export type OrderPaymentMethod = 'BANK' | 'CASH'

/** What the customer has already paid for the order (sink-inventory's order form). */
export type OrderPayment = { status: OrderPaymentStatus; method?: OrderPaymentMethod; bankId?: string; amountPaid?: number }

/** Payment keys exactly as sink sends them: method/bank/amount only when something was paid. */
const paymentPayload = ({ status, method, bankId, amountPaid }: OrderPayment) => ({
  payment_status: status,
  ...(status !== 'UNPAID' ? { payment_method: method === 'BANK' ? 'BANK-TRANSFER' : 'CASH' } : {}),
  ...(status !== 'UNPAID' && method === 'BANK' && bankId ? { bank: bankId } : {}),
  ...(status !== 'UNPAID' && amountPaid ? { amount_paid: amountPaid.toFixed(2) } : {}),
})
export type BackendShippingStatus = 'PENDING' | 'SHIPPED' | 'DELIVERED'

/** Backend shipping_status → the design's four statuses. Unknown values keep `rawStatus` for the UI. */
export const toShipmentStatus = (shippingStatus: string, paymentStatus: string): ShipmentStatus => {
  const status = shippingStatus.toUpperCase()
  if (['DELIVERED', 'COMPLETED'].includes(status)) return 'Delivered'
  if (['SHIPPED', 'IN_TRANSIT', 'IN-TRANSIT', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(status)) return 'In transit'
  return paymentStatus.toUpperCase() === 'UNPAID' ? 'Pending payment' : 'Awaiting pickup'
}

/** Design status → backend value for the shipping_status filter. */
export const toBackendStatus = (status: ShipmentStatus): BackendShippingStatus =>
  status === 'Delivered' ? 'DELIVERED' : status === 'In transit' ? 'SHIPPED' : 'PENDING'

const shortId = (id: string) => `SH-${id.replace(/-/g, '').slice(0, 6).toUpperCase()}`

export const mapOrder = (value: unknown): Shipment => {
  const order = asRecord(value)
  const id = str(order.id)
  const shippingStatus = str(order.shipping_status) || str(at(order, 'delivery.shipping_status'))
  const paymentStatus = str(order.payment_status)
  const total = num(order.total_price ?? order.amount)
  const destination = [str(at(order, 'delivery.city')), str(at(order, 'delivery.state'))].filter(Boolean).join(', ')
  const carrier = str(at(order, 'delivery.courier_name')) || str(order.courier_name) || str(at(order, 'delivery.courier'))
  return {
    id: shortId(id),
    orderId: id,
    customer: str(at(order, 'customer_info.name')) || 'Walk-in customer',
    customerPhone: str(at(order, 'customer_info.phone')),
    customerEmail: str(at(order, 'customer_info.email')),
    destination: destination || str(at(order, 'delivery.shipping_address')) || 'Address on file',
    carrier: carrier || (str(order.channel).toUpperCase() === 'INSTORE' ? 'In-store' : 'Delivery partner'),
    status: toShipmentStatus(shippingStatus, paymentStatus),
    rawStatus: shippingStatus,
    paymentStatus,
    amount: formatNaira(total),
    amountValue: total,
    shippingFee: num(order.shipping_fee ?? at(order, 'delivery.shipping_fee')),
    date: formatActivityDate(str(order.created_at)),
    paymentType: str(order.payment_type) || str(order.payment_method) || undefined,
    bnplStatus: str(order.bnpl_status) || undefined,
  }
}

/** paymentMethod 'BNPL' mirrors sink's Orders payment-method filter. */
export type OrdersQuery = { search?: string; status?: ShipmentStatus; paymentMethod?: 'BNPL'; page?: number; limit?: number }
export type OrdersPage = { shipments: Shipment[]; stats: DashboardStats; total: number; pages: number }

export const fetchOrders = async (businessId: string, { search, status, paymentMethod, page = 1, limit = 50 }: OrdersQuery = {}): Promise<OrdersPage> => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (search) params.set('search', search)
  if (status) params.set('shipping_status', toBackendStatus(status))
  if (paymentMethod) params.set('payment_method', paymentMethod)
  const response = await apiRequest<unknown>(`order/orders/${businessId}/all?${params}`)
  const root = asRecord(response)
  const results = asRecord(root.results)
  const all = listFrom(response, ['results.data', 'data', 'results']).map(mapOrder)
  // Also filtered here: sink's proxy never forwarded payment_method, so the backend may ignore it.
  const shipments = paymentMethod === 'BNPL' ? all.filter(shipment => shipment.paymentType?.toUpperCase() === 'BNPL' || Boolean(shipment.bnplStatus)) : all
  const now = new Date()
  const totalOrders = num(results.total_orders) || shipments.length
  const completed = num(results.completed_orders)
  return {
    shipments,
    total: num(root.total) || totalOrders,
    pages: num(root.pages) || 1,
    stats: {
      totalShipments: totalOrders,
      inTransit: shipments.filter(shipment => shipment.status === 'In transit').length,
      deliveredThisMonth: listFrom(response, ['results.data']).filter(order => {
        const record = asRecord(order)
        const created = new Date(str(record.created_at))
        return toShipmentStatus(str(record.shipping_status), str(record.payment_status)) === 'Delivered' && created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
      }).length,
      deliverySpend: shipments.reduce((sum, shipment) => sum + (shipment.shippingFee ?? 0), 0),
      fulfilled: completed,
      pending: Math.max(totalOrders - completed, 0),
    },
  }
}

export const fetchOrderDetails = async (orderId: string): Promise<ShipmentDetails> => {
  const response = asRecord(await apiRequest<unknown>(`order/single/${orderId}/`))
  const order = response.id ? response : asRecord(response.data)
  const delivery = asRecord(order.delivery)
  return {
    ...mapOrder(order),
    address: [str(delivery.shipping_address), str(delivery.city), str(delivery.state)].filter(Boolean).join(', '),
    products: listFrom(order.products, []).map(item => {
      const product = asRecord(item)
      return { name: str(product.name) || str(at(product, 'product.name')), quantity: num(product.quantity) || 1, price: num(product.price ?? product.selling_price ?? product.amount) }
    }),
    progress: {
      riderAssigned: Boolean(delivery.rider_assigned),
      pickedUp: Boolean(delivery.picked_up),
      outForDelivery: Boolean(delivery.out_for_delivery),
      delivered: Boolean(delivery.delivered) || toShipmentStatus(str(order.shipping_status), str(order.payment_status)) === 'Delivered',
    },
  }
}

export const refreshTracking = (orderId: string) => apiRequest<unknown>(`order/track_shipment/${encodeURIComponent(orderId)}/`, { method: 'POST' })

export const updateShippingStatus = ({ orderId, status }: { orderId: string; status: BackendShippingStatus }) =>
  apiRequest<unknown>(`order/change_shipping/${orderId}/?status=${status}`, { method: 'PATCH', body: {} })

// ─── Rates & booking ────────────────────────────────────────────────────────

/** Shipbubble rejects emojis and the symbols _ - + / ' #. */
const sanitize = (value: string) => value.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').replace(/︎|️/g, '').replace(/[_+/'#-]/g, ' ').replace(/\s+/g, ' ').trim()

const splitName = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length <= 1) return { first: parts[0] ?? '', last: parts[0] ?? '' }
  return { first: parts[0], last: parts.slice(1).join(' ') }
}

const COURIER_COLORS = ['#E84855', '#08A66C', '#3664E8', '#752DA8', '#D38A25', '#2A8C8C']

const mapCourier = (value: unknown, index: number): DeliveryPartner => {
  const courier = asRecord(value)
  const name = str(courier.courier_name) || 'Courier'
  const rating = num(courier.ratings)
  return {
    id: index + 1,
    name: name.split(' ')[0],
    full: name,
    initials: name.charAt(0).toUpperCase(),
    color: COURIER_COLORS[index % COURIER_COLORS.length],
    price: num(courier.total ?? courier.rate_card_amount),
    eta: str(courier.delivery_eta) || 'ETA on booking',
    rating: rating ? rating.toFixed(1) : '—',
    tag: '',
    serviceCode: str(courier.service_code) || str(courier.courier_id),
    courierId: str(courier.courier_id),
    image: str(courier.courier_image) || undefined,
  }
}

/** Tags the cheapest as "Best value" and the first-listed (Shipbubble sorts by speed) as "Fastest" when distinct. */
const tagRates = (rates: DeliveryPartner[]) => {
  if (!rates.length) return rates
  const cheapest = rates.reduce((best, rate) => (rate.price < best.price ? rate : best), rates[0])
  return rates.map(rate => ({ ...rate, tag: rate.id === cheapest.id ? 'Best value' : rate.id === rates[0].id ? 'Fastest' : '' }))
}

/** Delivery address body shared by fetch_shipment_rate and create_order_inhouse (sink's buildAddressPayload). */
const addressPayload = (customer: RateRequestInput['customer']) => {
  const { first, last } = splitName(customer.name)
  return {
    first_name: sanitize(first),
    last_name: sanitize(last),
    phone: customer.phone,
    alt_phone: null,
    email: customer.email,
    country: 'Nigeria',
    state: customer.state,
    city: customer.city ? sanitize(customer.city) : null,
    shipping_address: sanitize(customer.address),
  }
}

export const fetchShipmentRates = async ({ products, customer, note }: RateRequestInput): Promise<RateQuote> => {
  const response = await apiRequest<unknown>(`order/fetch_shipment_rate/${requireBusinessId()}/`, {
    method: 'POST',
    body: {
      products: products.map(product => ({ product_id: product.productId, quantity: product.quantity })),
      address: addressPayload(customer),
      ...(note ? { note } : {}),
    },
  })
  const root = asRecord(at(response, 'data.data') ?? asRecord(response).data ?? response)
  const couriers = listFrom(root, ['couriers', 'rates', 'results', 'data'])
  return { reference: str(root.reference), requestToken: str(root.request_token), rates: tagRates(couriers.map(mapCourier)) }
}

const createCustomer = async (businessId: string, customer: CreateShipmentInput['customer']) => {
  const response = asRecord(await apiRequest<unknown>(`customer/${businessId}/`, {
    method: 'POST',
    body: { name: customer.name, phone: customer.phone, ...(customer.email ? { email: customer.email } : {}) },
  }))
  const id = str(response.id) || str(at(response, 'data.id'))
  if (!id) throw new Error('Could not create the customer record for this shipment')
  return id
}

/** Books the selected courier on a quote. Returns the created order mapped to a Shipment. */
export const bookShipment = async (input: CreateShipmentInput & { quote: RateQuote }, payment: OrderPayment = { status: 'UNPAID' }): Promise<Shipment> => {
  const businessId = requireBusinessId()
  const courier = input.quote.rates.find(rate => rate.id === input.partnerId)
  if (!courier?.serviceCode) throw new Error('Please select a delivery option')
  const customerId = input.customerId ?? await createCustomer(businessId, input.customer)
  const response = asRecord(await apiRequest<unknown>(`order/business/create_order_shipbubble/${input.quote.reference}/`, {
    method: 'POST',
    body: {
      customer: customerId,
      ...paymentPayload(payment),
      request_token: input.quote.requestToken,
      service_code: courier.serviceCode,
      courier_id: courier.courierId ?? '',
      channel: 'OUTSTORE',
    },
  }))
  const order = response.id ? response : asRecord(response.data ?? at(response, 'data.data'))
  const base: Shipment = order.id ? mapOrder(order) : {
    id: `SH-${input.quote.reference.replace(/-/g, '').slice(0, 6).toUpperCase()}`,
    customer: input.customer.name,
    destination: [input.customer.city, input.customer.state].filter(Boolean).join(', ') || input.customer.address,
    carrier: courier.full,
    status: 'Awaiting pickup',
    amount: formatNaira(courier.price),
    date: 'Just now',
  }
  return { ...base, customer: input.customer.name, carrier: courier.full, amount: formatNaira(courier.price), shippingFee: courier.price }
}

/** The business's own delivery rate, used when Shipbubble isn't active (sink's in-house flow). */
export type InhouseDelivery = { shippingMethodId: string; name: string; fee: number; shippingDate?: string; note?: string }

/** POST order/business/create_order_inhouse/{business_id}/ — order delivered with one of the business's own rates. */
export const createInhouseOrder = async (input: CreateShipmentInput & { delivery: InhouseDelivery; payment: OrderPayment }): Promise<Shipment> => {
  const businessId = requireBusinessId()
  const products = input.products.filter(product => product.productId).map(product => ({ product_id: product.productId as string, quantity: Number(product.quantity) || 1 }))
  if (!products.length) throw new Error('Pick the items from your item list to create this order')
  const customer = { ...input.customer, email: input.customer.email ?? '', state: input.customer.state ?? '' }
  const customerId = input.customerId ?? await createCustomer(businessId, input.customer)
  const response = asRecord(await apiRequest<unknown>(`order/business/create_order_inhouse/${businessId}/`, {
    method: 'POST',
    body: {
      products,
      address: addressPayload(customer),
      ...(input.delivery.shippingDate ? { shipping_date: input.delivery.shippingDate } : {}),
      ...(input.delivery.note ? { note: input.delivery.note } : {}),
      customer: customerId,
      ...paymentPayload(input.payment),
      shipping_id: input.delivery.shippingMethodId,
    },
  }))
  const order = response.id ? response : asRecord(response.data ?? at(response, 'data.data'))
  const total = input.products.reduce((sum, item) => sum + (Number(item.amount) || 0) * (Number(item.quantity) || 1), 0) + input.delivery.fee
  const base: Shipment = order.id ? mapOrder(order) : {
    id: 'SH-NEW',
    customer: input.customer.name,
    destination: [input.customer.city, input.customer.state].filter(Boolean).join(', ') || input.customer.address,
    carrier: input.delivery.name,
    status: input.payment.status === 'UNPAID' ? 'Pending payment' : 'Awaiting pickup',
    amount: formatNaira(total),
    date: 'Just now',
  }
  return { ...base, customer: input.customer.name, carrier: input.delivery.name, shippingFee: input.delivery.fee }
}

/** PATCH order/mark-paid/{order_id}/ — sink's "Update payment" on an order: { status, amount, method, bank }. */
export const markOrderPaid = ({ orderId, status, amount, method, bankId }: { orderId: string; status: OrderPaymentStatus; amount?: number; method?: OrderPaymentMethod; bankId?: string }) =>
  apiRequest<unknown>(`order/mark-paid/${orderId}/`, {
    method: 'PATCH',
    body: {
      status,
      ...(status !== 'UNPAID' ? { amount, method } : {}),
      ...(status !== 'UNPAID' && method === 'BANK' && bankId ? { bank: bankId } : {}),
    },
  })

// ─── Reference data ─────────────────────────────────────────────────────────

export const fetchBoxSizes = async (): Promise<BoxSize[]> =>
  listFrom(await apiRequest<unknown>('order/shipping_dimention/'), ['data', 'results']).map(value => {
    const box = asRecord(value)
    return { name: str(box.name), imageUrl: str(box.description_image_url), height: num(box.height), width: num(box.width), length: num(box.length), maxWeight: num(box.max_weight) }
  })

export const fetchShippingCategories = async (): Promise<ShippingCategory[]> =>
  listFrom(await apiRequest<unknown>('order/shipping_category/'), ['data', 'results']).map(value => {
    const category = asRecord(value)
    return { id: num(category.category_id), name: str(category.category) }
  })
