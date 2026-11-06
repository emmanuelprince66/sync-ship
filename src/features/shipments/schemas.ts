import { z } from 'zod'
import { DEFAULT_STATE, NIGERIAN_STATES } from './constants'

const packageItemSchema = z.object({
  name: z.string().trim().min(1, 'Enter the product name'),
  quantity: z.string(),
  amount: z.string(),
  weight: z.string().refine(value => Number(value) > 0, 'Enter the package weight'),
  length: z.string(),
  width: z.string(),
  /** Set when the line was picked from the item list; the backend orders saved products only. */
  productId: z.string().optional(),
})

const customerSchema = z.object({
  name: z.string(),
  phone: z.string(),
  address: z.string(),
  email: z.string(),
  state: z.string(),
  city: z.string(),
})

/** What the customer has already paid — the same fields as sink-inventory's order form. */
const paymentSchema = z.object({
  status: z.enum(['UNPAID', 'PAID', 'PARTIAL']),
  method: z.enum(['BANK', 'CASH']),
  bankId: z.string(),
  amountPaid: z.string(),
})

export const shipmentFormSchema = z
  .object({
    products: z.array(packageItemSchema).min(1, 'Add at least one item'),
    method: z.enum(['merchant', 'customer']),
    customer: customerSchema,
    partnerId: z.number(),
    payment: paymentSchema,
    /** Required by sink for in-house deliveries (YYYY-MM-DD). */
    shippingDate: z.string(),
    note: z.string(),
  })
  .superRefine((values, ctx) => {
    // Delivery and payment details are only needed when the merchant completes checkout.
    if (values.method !== 'merchant') return
    const { customer, payment } = values
    const issue = (path: (string | number)[], message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, path, message })
    if (!customer.name.trim()) issue(['customer', 'name'], 'Enter the customer’s name')
    if (customer.phone.replace(/\D/g, '').length < 10) issue(['customer', 'phone'], 'Enter a valid phone number')
    if (!customer.email.trim()) issue(['customer', 'email'], 'Enter the customer’s email')
    else if (!z.string().email().safeParse(customer.email.trim()).success) issue(['customer', 'email'], 'Enter a valid email address')
    if (!(NIGERIAN_STATES as readonly string[]).includes(customer.state)) issue(['customer', 'state'], 'Select a state')
    if (!customer.address.trim()) issue(['customer', 'address'], 'Enter the delivery address')
    if (payment.status !== 'UNPAID' && payment.method === 'BANK' && !payment.bankId) issue(['payment', 'bankId'], 'Select the bank the money went into')
    if (payment.status === 'PARTIAL' && !(Number(payment.amountPaid) > 0)) issue(['payment', 'amountPaid'], 'Enter the amount paid so far')
  })

export type ShipmentFormValues = z.infer<typeof shipmentFormSchema>
export type PackageItemValues = ShipmentFormValues['products'][number]
export type PaymentStatusValue = ShipmentFormValues['payment']['status']
export type PaymentMethodValue = ShipmentFormValues['payment']['method']

export const emptyPackageItem = (): PackageItemValues => ({ name: '', quantity: '1', amount: '', weight: '', length: '', width: '' })

const today = () => new Date().toISOString().slice(0, 10)

export const shipmentFormDefaults = (): ShipmentFormValues => ({
  products: [],
  method: 'merchant',
  customer: { name: '', phone: '', address: '', email: '', state: DEFAULT_STATE, city: '' },
  partnerId: 1,
  payment: { status: 'UNPAID', method: 'BANK', bankId: '', amountPaid: '' },
  shippingDate: today(),
  note: '',
})
