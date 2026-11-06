import { z } from 'zod'

/**
 * Shipbubble Configure validation — sink-inventory's validateAddress + validateSettings,
 * same order and messages. The default package size rule is intentionally gone (not needed by the backend).
 * Issues come back in key order, so the first one is the message to show.
 */
const required = (label: string) => z.string().refine(value => value.trim().length > 0, `Please fill in ${label}.`)

export const shipbubbleSetupSchema = z.object({
  street: required('street'),
  city: required('city'),
  state: required('state'),
  phone: required('phone'),
  category: z.object({ id: z.number(), name: z.string() }).nullable().refine(value => value !== null, 'Pick a shipping category.'),
})

/** In-house shipping method — sink-inventory's shippingMethodSchema. */
export const shippingMethodFormSchema = z.object({
  location: z.string().trim().min(1, 'Location name is required').max(255, 'Location name must be less than 255 characters'),
  fee: z.string().refine(value => {
    if (value === '') return true
    const num = parseFloat(value)
    return !Number.isNaN(num) && num >= 0
  }, 'Please enter a valid amount'),
  description: z.string().trim().min(1, 'Shipping description is required').max(500, 'Description must be less than 500 characters'),
  visible: z.boolean(),
})

export type ShippingMethodFormValues = z.infer<typeof shippingMethodFormSchema>
export const shippingMethodFormDefaults: ShippingMethodFormValues = { location: '', fee: '', description: '', visible: false }
