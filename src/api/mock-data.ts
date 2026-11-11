/**
 * Sample data from the design. Lives in memory so mutations persist for the
 * session. Replace each service in src/api/*.ts with a real call as backend
 * endpoints become available; components only depend on the hooks.
 */
import type { UnknownRecord } from './http'
import type { BusinessSettings, CatalogItem, DashboardStats, DeliveryPartner, Employee, Shipment, Wallet } from './types'

const daysAgo = (days: number) => new Date(Date.now() - days * 86400 * 1000).toISOString()

/** A customer row in the shape GET customer/{business_id}/ answers (sink-inventory's backend). */
const customerRow = (id: string, name: string, phone: string, email: string, totalSales: number, salesCount: number, wallet: number, debt: number, status: string, extra: UnknownRecord = {}): UnknownRecord => ({
  id, name, phone, email, total_sales: totalSales, sales_count: salesCount, wallet_balance: wallet, credit_balance: debt, status,
  customer_code: `CUS-${id.slice(-6).toUpperCase()}`, gender: null, date_of_birth: null, notes: '', addresses: [], last_visit: daysAgo(salesCount ? 3 : 60), created_at: daysAgo(200), ...extra,
})

const customerAddress = (street: string, city: string, state: string) => ({ id: `addr-${street.length}`, address: street, city, state, country: 'Nigeria', phone: null, is_default: true, created_at: daysAgo(120) })


export const db: {
  shipments: Shipment[]
  items: CatalogItem[]
  partners: DeliveryPartner[]
  wallet: Wallet
  settings: BusinessSettings
  employees: Employee[]
  stats: DashboardStats
  /** Raw backend-shaped customer records, mapped by src/api/customers.ts. */
  customers: UnknownRecord[]
} = {
  shipments: [
    { id: 'SH-28451', customer: 'Amaka Nwosu', destination: 'Lekki, Lagos', carrier: 'Kwik Delivery', status: 'In transit', amount: '₦6,450', date: 'Today, 10:24 AM' },
    { id: 'SH-28450', customer: 'Tobi Adeyemi', destination: 'Yaba, Lagos', carrier: 'Gokada', status: 'Awaiting pickup', amount: '₦4,200', date: 'Today, 9:12 AM' },
    { id: 'SH-28442', customer: 'Seyi Martins', destination: 'Ikeja, Lagos', carrier: 'Sendbox', status: 'Delivered', amount: '₦5,850', date: 'Yesterday, 3:45 PM' },
    { id: 'SH-28439', customer: 'Jide Okafor', destination: 'Surulere, Lagos', carrier: 'Fez Delivery', status: 'Delivered', amount: '₦3,900', date: 'Aug 24, 11:02 AM' },
    { id: 'SH-28431', customer: 'Mariam Bello', destination: 'Ajah, Lagos', carrier: 'Kwik Delivery', status: 'Delivered', amount: '₦7,200', date: 'Aug 23, 2:16 PM' },
  ],
  items: [
    { id: 1, description: 'Full-grain leather with brass hardware', listed: true, name: 'Classic leather handbag', weight: '2.5', price: '48000', inStock: true, image: 'https://images.unsplash.com/photo-1654707635478-b57d95c4e8e1?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=800' },
    { id: 2, listed: true, name: 'Ivory mini bag', weight: '1.2', price: '32500', inStock: true, image: 'https://images.unsplash.com/photo-1623683945420-f0f890b59b6b?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=800' },
    { id: 3, listed: false, name: 'Home fragrance candle', weight: '0.8', price: '18500', inStock: false, image: 'https://images.unsplash.com/photo-1570431309787-5874f7dd7593?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=800' },
  ],
  partners: [
    { id: 1, name: 'Kwik', full: 'Kwik Delivery', initials: 'K', color: '#E84855', price: 4650, eta: '45–60 mins', rating: '4.8', tag: 'Best value' },
    { id: 2, name: 'Gokada', full: 'Gokada', initials: 'G', color: '#08A66C', price: 5200, eta: '35–50 mins', rating: '4.7', tag: 'Fastest' },
    { id: 3, name: 'Sendbox', full: 'Sendbox', initials: 'S', color: '#3664E8', price: 5850, eta: '1–2 hours', rating: '4.6', tag: '' },
    { id: 4, name: 'Fez', full: 'Fez Delivery', initials: 'F', color: '#752DA8', price: 6100, eta: '2–3 hours', rating: '4.9', tag: '' },
  ],
  wallet: {
    balance: 184350,
    virtualAccount: { number: '1028 459 731', name: 'Kemi Adeyemi Stores Ltd', bank: 'Wema Bank' },
    withdrawalAccount: { bank: 'GTBank', maskedNumber: '0188••••12', accountName: 'KEMI ADEYEMI STORES LTD', verified: true, accountNumber: '0188454812' },
    walletBankId: 'mock-wallet',
    transactions: [
      { id: 't1', label: 'Customer payment · SH-28442', date: 'Aug 25, 2025', amount: 48000, kind: 'credit', icon: 'wallet' },
      { id: 't2', label: 'Delivery fee · SH-28451', date: 'Aug 24, 2025', amount: 4650, kind: 'debit', icon: 'wallet' },
      { id: 't3', label: 'Withdrawal to GTBank', date: 'Aug 23, 2025', amount: 80000, kind: 'debit', icon: 'bank' },
      { id: 't4', label: 'Customer payment · SH-28439', date: 'Aug 22, 2025', amount: 32500, kind: 'credit', icon: 'wallet' },
    ],
  },
  settings: {
    storeUrl: 'store.syncship.africa/kemi-store',
    storefront: { name: 'Kemi’s Store', phone: '0802 400 1294', whatsapp: '0802 400 1294', email: 'hello@kemistore.com', analytics: true, active: true },
    shipping: { business: 'Kemi’s Store', contact: 'Kemi Adeyemi', phone: '0802 400 1294', location: '22 Awolowo Road, Ikoyi, Lagos', category: 'Fashion & accessories', defaultKg: '2.5', active: false },
    payments: { online: true, wallet: true, kyc: false, bank: 'Guaranty Trust Bank', account: '0188454812' },
    channels: { email: true, sms: true, whatsapp: true, order: true, payout: true },
  },
  employees: [
    { id: 'emp-1', name: 'Kemi Adeyemi', email: 'kemi@kemistore.com', phone: '0802 400 1294', role: 'OWNER', roleLabel: 'Owner', status: 'Active' },
    { id: 'emp-2', name: 'Tola Martins', email: '', phone: '0803 111 2233', role: 'ADMIN-ATTENDANT', roleLabel: 'Admin attendant', status: 'Active' },
    { id: 'emp-3', name: 'Ada Okeke', email: '', phone: '0805 444 5566', role: 'ATTENDANT', roleLabel: 'Attendant', status: 'Inactive' },
  ],
  stats: { totalShipments: 1284, inTransit: 18, deliveredThisMonth: 342, deliverySpend: 428650, fulfilled: 1146, pending: 18 },
  customers: [
    customerRow('mock-cus-a1b2c3', 'Amaka Nwosu', '08032457791', 'amaka@example.com', 284500, 14, 12000, 0, 'Active', { gender: 'FEMALE', date_of_birth: '1992-04-18', tier_name: 'Gold', notes: 'Prefers deliveries after 4pm. Gate code 2210.', addresses: [customerAddress('14 Admiralty Way', 'Lekki', 'Lagos')] }),
    customerRow('mock-cus-d4e5f6', 'Tobi Adeyemi', '08124401290', 'tobi@example.com', 96500, 6, 0, 18500, 'Active', { gender: 'MALE', addresses: [customerAddress('3 Herbert Macaulay Way', 'Yaba', 'Lagos')] }),
    customerRow('mock-cus-g7h8i9', 'Seyi Martins', '07065512340', '', 41200, 3, 2500, 0, 'New', { gender: 'FEMALE' }),
    customerRow('mock-cus-j1k2l3', 'Ibrahim Musa', '09033218877', 'ibrahim.musa@example.com', 187000, 11, 0, 0, 'At Risk', { gender: 'MALE', addresses: [customerAddress('22 Ahmadu Bello Way', 'Garki', 'Federal Capital Territory')] }),
    customerRow('mock-cus-m4n5o6', 'Mariam Bello', '08055230012', 'mariam@example.com', 12500, 1, 0, 0, 'Inactive', { addresses: [customerAddress('5 Ado Road', 'Ajah', 'Lagos')] }),
    customerRow('mock-cus-p7q8r9', 'Jide Okafor', '08188776655', '', 63800, 5, 7000, 4500, 'Active', { gender: 'MALE', addresses: [customerAddress('9 Bode Thomas Street', 'Surulere', 'Lagos')] }),
    customerRow('mock-cus-s1t2u3', 'Halima Bello', '07031124567', 'halima@example.com', 22000, 2, 0, 0, 'New'),
    customerRow('mock-cus-v4w5x6', 'Segun Oladipo', '08099001122', 'segun@example.com', 315000, 19, 30000, 0, 'Active', { tier_name: 'Platinum', addresses: [customerAddress('8 Ring Road', 'Ibadan', 'Oyo')] }),
  ],
}

/** One sample ledger per customer, as GET customer/transactions/{id}/ answers. */
export const sampleCustomerTransactions = (customerId: string): UnknownRecord[] => {
  const seed = customerId.length
  return [
    { id: `${customerId}-t1`, type: 'PURCHASE', title: 'Order delivered', reference: `SH-284${seed}1`, amount: 48000, flow: 'OUTFLOW', payment_method: 'TRANSFER', status: 'PAID', attendant: 'Kemi Adeyemi', created_at: daysAgo(2) },
    { id: `${customerId}-t2`, type: 'WALLET', title: 'Wallet top-up', reference: null, amount: 10000, flow: 'INFLOW', payment_method: 'CASH', status: 'SUCCESSFUL', attendant: 'Kemi Adeyemi', created_at: daysAgo(6) },
    { id: `${customerId}-t3`, type: 'PURCHASE', title: 'Storefront order', reference: `SH-284${seed}7`, amount: 32500, flow: 'OUTFLOW', payment_method: 'CARD', status: 'PAID', attendant: null, created_at: daysAgo(14) },
    { id: `${customerId}-t4`, type: 'DEBT', title: 'Debt settlement', reference: `SH-284${seed}0`, amount: 5000, flow: 'INFLOW', payment_method: 'TRANSFER', status: 'SUCCESSFUL', attendant: 'Kemi Adeyemi', created_at: daysAgo(21) },
    { id: `${customerId}-t5`, type: 'LOYALTY', title: 'Loyalty reward', reference: null, amount: 1500, flow: 'INFLOW', payment_method: null, status: 'SUCCESSFUL', attendant: null, created_at: daysAgo(30) },
    // Older orders, so the history runs past one page.
    ...Array.from({ length: 8 }, (_, index) => ({ id: `${customerId}-o${index}`, type: 'PURCHASE', title: 'Order delivered', reference: `SH-27${seed}${index}2`, amount: 12500 + index * 3500, flow: 'OUTFLOW', payment_method: index % 2 ? 'CASH' : 'TRANSFER', status: 'PAID', attendant: 'Kemi Adeyemi', created_at: daysAgo(40 + index * 9) })),
  ]
}

export const BUSINESS_CATEGORIES = ['Fashion & accessories', 'Beauty & cosmetics', 'Pharmacy & health', 'Food & grocery', 'Electronics', 'Home & lifestyle', 'Other'] as const
export const SIGNUP_BUSINESS_CATEGORIES = ['Fashion & accessories', 'Food & grocery', 'Beauty & wellness', 'Electronics', 'Other'] as const
export const SETTLEMENT_BANKS = ['Guaranty Trust Bank', 'Access Bank', 'First Bank', 'Wema Bank'] as const
export const PICKUP_ADDRESS = { label: 'Kemi’s Store, Ikoyi', full: 'Kemi’s Store, 22 Awolowo Road, Ikoyi, Lagos' }
export const PLACEHOLDER_ITEM_IMAGE = 'https://images.unsplash.com/photo-1686575131299-6e56fe3fc17b?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=800'
