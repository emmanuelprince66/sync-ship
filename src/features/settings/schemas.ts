import { z } from 'zod'
import { STAFF_ROLES } from '@/api/settings'

const STAFF_ROLE_LABELS = STAFF_ROLES.map(role => role.label) as [string, ...string[]]

/** "0803 245 7791" → "+2348032457791" (the format sink-inventory sends). */
export const toInternationalPhone = (value: string) => {
  const digits = value.replace(/\D/g, '')
  if (digits.startsWith('234')) return `+${digits}`
  if (digits.startsWith('0')) return `+234${digits.slice(1)}`
  return digits ? `+234${digits}` : ''
}

export const inviteEmployeeSchema = z.object({
  firstname: z.string().trim().min(1, 'Enter a first name').max(50),
  lastname: z.string().trim().min(1, 'Enter a last name').max(50),
  phone: z.string().trim().refine(value => value.replace(/\D/g, '').length >= 10, 'Enter a valid phone number'),
  role: z.enum(STAFF_ROLE_LABELS),
})

export type InviteEmployeeValues = z.infer<typeof inviteEmployeeSchema>

export const inviteEmployeeDefaults: InviteEmployeeValues = { firstname: '', lastname: '', phone: '', role: STAFF_ROLES[0].label }

// ─── Settlement bank ────────────────────────────────────────────────────────

const optionalAmount = z.string().trim().refine(value => value === '' || (Number.isFinite(Number(value)) && Number(value) >= 0), 'Enter a positive amount')

export const addBankSchema = z
  .object({
    bankCode: z.string().min(1, 'Choose a bank'),
    accountNumber: z.string().regex(/^\d{10}$/, 'Account numbers are 10 digits'),
    accountName: z.string().trim().min(2, 'Enter the account name'),
    minFee: optionalAmount,
    maxFee: optionalAmount,
    percentage: optionalAmount.refine(value => value === '' || Number(value) <= 100, 'Percentage cannot exceed 100'),
  })
  .refine(values => {
    const filled = [values.minFee, values.maxFee, values.percentage].filter(value => value !== '').length
    return filled === 0 || filled === 3
  }, { message: 'Fill in all three charge fields, or leave them all empty', path: ['percentage'] })
export type AddBankValues = z.infer<typeof addBankSchema>
export const addBankDefaults: AddBankValues = { bankCode: '', accountNumber: '', accountName: '', minFee: '', maxFee: '', percentage: '' }

// ─── Shipping ───────────────────────────────────────────────────────────────

export const pickupSchema = z.object({
  street: z.string().trim().min(3, 'Enter the street address'),
  city: z.string().trim().min(2, 'Enter the city or area'),
  state: z.string().trim().min(1, 'Choose a state'),
  phone: z.string().trim().min(7, 'Enter a phone number riders can call'),
  landmark: z.string().trim(),
  categoryId: z.string().min(1, 'Choose what you usually ship'),
  packageSize: z.string().min(1, 'Pick a default package size'),
})
export type PickupValues = z.infer<typeof pickupSchema>

export const shippingMethodSchema = z.object({
  location: z.string().trim().min(2, 'Name the area this rate covers'),
  fee: z.string().trim().refine(value => value === '' || (Number.isFinite(Number(value)) && Number(value) >= 0), 'Enter a valid fee'),
  description: z.string().trim().max(200, 'Keep it under 200 characters'),
})
export type ShippingMethodValues = z.infer<typeof shippingMethodSchema>
export const shippingMethodDefaults: ShippingMethodValues = { location: '', fee: '', description: '' }
