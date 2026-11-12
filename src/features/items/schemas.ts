import { z } from 'zod'

export const itemFormSchema = z.object({
  name: z.string().trim().min(1, 'Enter the item name').max(255, 'Keep the name under 255 characters'),
  description: z.string(),
  price: z.string().trim().refine(value => value !== '' && Number(value) >= 0, 'Enter the selling price'),
  // Optional: blank falls back to the business's default package weight on the backend.
  weight: z.string().trim().refine(value => value === '' || Number(value) >= 0, 'Weight cannot be negative'),
  sku: z.string().trim().max(64, 'Keep the SKU under 64 characters'),
  available: z.boolean(),
  listed: z.boolean(),
})

export type ItemFormValues = z.infer<typeof itemFormSchema>

export const itemFormDefaults: ItemFormValues = { name: '', description: '', price: '', weight: '', sku: '', available: true, listed: true }
