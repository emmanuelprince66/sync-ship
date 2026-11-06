import { z } from 'zod'

export const addItemSchema = z.object({
  name: z.string().trim().min(1, 'Enter the item name'),
  weight: z.string().trim().refine(value => Number(value) > 0, 'Weight must be more than 0 kg'),
  price: z.string().trim().refine(value => value === '' || Number(value) >= 0, 'Price cannot be negative'),
  image: z.string(),
})

export type AddItemValues = z.infer<typeof addItemSchema>

export const addItemDefaults: AddItemValues = { name: '', weight: '', price: '', image: '' }

/** CSV import limits. Excel files must be saved as .csv first. */
export const IMPORT_MAX_BYTES = 5 * 1024 * 1024
