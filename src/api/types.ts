export type ShipmentStatus = 'Delivered' | 'In transit' | 'Awaiting pickup' | 'Pending payment'

export type Shipment = {
  id: string
  customer: string
  destination: string
  carrier: string
  status: ShipmentStatus
  /** Display amount, e.g. "₦6,450". */
  amount: string
  /** Display date, e.g. "Today, 10:24 AM". */
  date: string
  /** Live only: backend order UUID (use for details/tracking calls). `id` is the short display id. */
  orderId?: string
  /** Live only: backend shipping_status (PENDING | SHIPPED | DELIVERED | CANCELLED …). */
  rawStatus?: string
  /** Live only: backend payment_status (UNPAID | PARTIAL | PAID). */
  paymentStatus?: string
  /** Live only: numeric amount in naira (amount is the formatted string). */
  amountValue?: number
  /** Live only: delivery fee in naira. */
  shippingFee?: number
  customerPhone?: string
  customerEmail?: string
  /** Live only: how the customer paid (e.g. BNPL, BANK-TRANSFER, CARD). */
  paymentType?: string
  /** Live only: Akawopay BNPL state (PENDING | APPROVED | REJECTED). */
  bnplStatus?: string
}

/** One package line in the create-shipment wizard. All fields are form strings. */
export type PackageItem = {
  id: number
  name: string
  quantity: string
  amount: string
  weight: string
  /** Set when the line came from a live catalog product; required for live rates. */
  productId?: string
}

/** One saved gallery picture of an item. */
export type ItemMedia = { id: string; url: string }

export type CatalogItem = {
  id: number
  name: string
  /** kg, as string to match form input. */
  weight: string
  /** NGN, as string to match form input. */
  price: string
  /** Cover picture (first gallery image); empty when the item has no picture yet. */
  image: string
  /** Saved gallery pictures in order (`media` on the API); empty for items with only the legacy `image`. */
  media?: ItemMedia[]
  /** Available to order (`availability` on the API). */
  inStock: boolean
  /** Shows on the public storefront (`listed_on_storefront`). */
  listed?: boolean
  description?: string
  /** Live only: backend product UUID (`id` is a stable numeric key for the UI). */
  productId?: string
  /** Live only: units in stock. */
  quantity?: number
}

/** Per-product sales. `orders`/`last` are null when the backend doesn't report them. */
export type ItemSale = { item: CatalogItem; orders: number | null; units: number; revenue: number; last: string | null }

export type DeliveryPartner = {
  id: number
  name: string
  full: string
  initials: string
  color: string
  price: number
  eta: string
  rating: string
  tag: string
  /** Live (Shipbubble) rate fields, needed to book. */
  serviceCode?: string
  courierId?: string
  image?: string
}

export type CheckoutMethod = 'merchant' | 'customer'
export type PaymentMethod = 'wallet' | 'checkout'

export type CustomerDetails = {
  name: string
  phone: string
  address: string
  /** Live: Shipbubble needs email, state (full name, e.g. "Lagos") and optionally city. */
  email?: string
  state?: string
  city?: string
}

export type CreateShipmentInput = {
  products: PackageItem[]
  method: CheckoutMethod
  paymentMethod: PaymentMethod
  customer: CustomerDetails
  partnerId: number
  /** Live: the quote returned by useShipmentRates. Without it the booking falls back to sample data. */
  quote?: RateQuote
  /** Live: existing Sync360 customer id; one is created from `customer` when omitted. */
  customerId?: string
}

/** Result of POST order/fetch_shipment_rate — needed to book with create_order_shipbubble. */
export type RateQuote = { reference: string; requestToken: string; rates: DeliveryPartner[] }

export type RateRequestInput = {
  /** Live catalog products only (PackageItem.productId). */
  products: { productId: string; quantity: number }[]
  customer: CustomerDetails & { email: string; state: string }
  note?: string
}

export type BoxSize = { name: string; imageUrl: string; height: number; width: number; length: number; maxWeight: number }
export type ShippingCategory = { id: number; name: string }

/** Live order detail (GET order/single/{id}/), for the order drawer. */
export type ShipmentDetails = Shipment & {
  address: string
  products: { name: string; quantity: number; price: number }[]
  progress: { riderAssigned: boolean; pickedUp: boolean; outForDelivery: boolean; delivered: boolean }
}

export type CreateShipmentResult = { shipment: Shipment; checkoutLink?: string }

export type WalletTransaction = {
  id: string
  label: string
  date: string
  amount: number
  kind: 'credit' | 'debit'
  icon: 'wallet' | 'bank'
  /** An Akawopay (BNPL) settlement landing in the wallet. */
  isBnpl?: boolean
  /** The sale this BNPL credit settled (bnpl_details.order_reference). */
  bnplReference?: string
}

export type BankAccount = { bank: string; maskedNumber: string; accountName: string; verified: boolean; accountNumber: string }

export type Wallet = {
  balance: number
  virtualAccount: { number: string; name: string; bank: string }
  /** First settlement account (Settings › Payments). Null until one is added. */
  withdrawalAccount: BankAccount | null
  transactions: WalletTransaction[]
  /** Live: the business bank id the wallet is keyed on (transfers go out of it). Null until KYC creates one. */
  walletBankId: string | null
}

export type SettingsSection = 'Storefront' | 'Shipping setup' | 'Payments & KYC' | 'Team & users' | 'Communications'

export type StorefrontSettings = { name: string; phone: string; whatsapp: string; email: string; analytics: boolean; active: boolean }
export type ShippingSettings = { business: string; contact: string; phone: string; location: string; category: string; defaultKg: string; active: boolean }
export type PaymentSettings = { online: boolean; wallet: boolean; kyc: boolean; bank: string; account: string }
export type ChannelSettings = { email: boolean; sms: boolean; whatsapp: boolean; order: boolean; payout: boolean }

export type BusinessSettings = {
  storefront: StorefrontSettings
  shipping: ShippingSettings
  payments: PaymentSettings
  channels: ChannelSettings
  storeUrl: string
}

/** Staff roles the backend accepts for business/add_attendant (same list as sink-inventory). */
export type StaffRole = 'ATTENDANT' | 'ADMIN-ATTENDANT' | 'PHARMACIST' | 'ACCOUNTANT' | 'INVENTORY-MANAGER' | 'PRODUCTION-MANAGER'
export type EmployeeRole = StaffRole | 'OWNER'
export type Employee = { id: string; name: string; email: string; phone: string; role: EmployeeRole; roleLabel: string; status: 'Active' | 'Inactive' }
export type InviteEmployeeInput = { firstname: string; lastname: string; phone: string; role: StaffRole }

export type DashboardStats = {
  totalShipments: number
  inTransit: number
  deliveredThisMonth: number
  deliverySpend: number
  fulfilled: number
  pending: number
}
