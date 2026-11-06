import { z } from 'zod'
import { DEFAULT_STATE, NIGERIAN_STATES } from './constants'

const packageItemSchema = z.object({
  name: z.string().trim().min(1, 'Enter the product name'),
  quantity: z.string(),
  amount: z.string(),
  weight: z.string().refine(value => Number(value) > 0, 'Enter the package weight'),
  length: z.string(),
  width: z.string(),
  /** Set when the line was picked from the item list; needed for live rates. */
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

export const shipmentFormSchema = z
  .object({
    products: z.array(packageItemSchema).min(1, 'Add at least one item'),
    method: z.enum(['merchant', 'customer']),
    paymentMethod: z.enum(['wallet', 'checkout']),
    customer: customerSchema,
    partnerId: z.number(),
  })
  .superRefine((values, ctx) => {
    // Delivery details are only needed when the merchant completes checkout.
    if (values.method !== 'merchant') return
    const { customer } = values
    const issue = (field: keyof typeof customer, message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['customer', field], message })
    if (!customer.name.trim()) issue('name', 'Enter the customer’s name')
    if (customer.phone.replace(/\D/g, '').length < 10) issue('phone', 'Enter a valid phone number')
    if (!customer.email.trim()) issue('email', 'Enter the customer’s email')
    else if (!z.string().email().safeParse(customer.email.trim()).success) issue('email', 'Enter a valid email address')
    if (!(NIGERIAN_STATES as readonly string[]).includes(customer.state)) issue('state', 'Select a state')
    if (!customer.address.trim()) issue('address', 'Enter the delivery address')
  })

export type ShipmentFormValues = z.infer<typeof shipmentFormSchema>
export type PackageItemValues = ShipmentFormValues['products'][number]

export const emptyPackageItem = (): PackageItemValues => ({ name: '', quantity: '1', amount: '', weight: '', length: '', width: '' })

export const shipmentFormDefaults: ShipmentFormValues = {
  products: [],
  method: 'merchant',
  paymentMethod: 'wallet',
  customer: { name: '', phone: '', address: '', email: '', state: DEFAULT_STATE, city: '' },
  partnerId: 1,
}
