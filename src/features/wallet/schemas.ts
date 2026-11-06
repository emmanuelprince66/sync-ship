import { z } from 'zod'
import { MIN_WITHDRAWAL, stampDuty, transferCharge } from '@/api/wallet'

export const withdrawSchema = (balance: number) => z.object({
  amount: z.string()
    .min(1, 'Enter an amount')
    .refine(value => Number(value) >= MIN_WITHDRAWAL, `Minimum withdrawal is ₦${MIN_WITHDRAWAL.toLocaleString()}`)
    .refine(value => {
      const amount = Number(value)
      return amount + transferCharge(amount) + stampDuty(amount) <= balance
    }, 'Amount plus charges is more than your available balance'),
  pin: z.string().regex(/^\d{4}$/, 'Enter your 4-digit transaction PIN'),
})

export type WithdrawFormValues = z.infer<ReturnType<typeof withdrawSchema>>
