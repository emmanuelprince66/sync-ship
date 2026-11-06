import { z } from 'zod'

export const deliverySchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name'),
  phone: z.string().trim().regex(/^\+?[\d\s-]{7,}$/, 'Enter a valid phone number'),
  address: z.string().trim().min(5, 'Enter your full delivery address'),
})

export type DeliveryValues = z.infer<typeof deliverySchema>

export const deliveryDefaults: DeliveryValues = { fullName: '', phone: '', address: '' }

export const DELIVERY_FORM_ID = 'storefront-delivery-form'
