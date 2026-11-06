import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { MIN_WITHDRAWAL, stampDuty, transferCharge, useWallet, useWithdraw } from '@/api/wallet'
import { formatNaira } from '@/lib/format'
import { paths, settingsPath } from '@/routes/paths'
import { formatBalance } from '../format'
import { withdrawSchema, type WithdrawFormValues } from '../schemas'

export const useWithdrawForm = () => {
  const navigate = useNavigate()
  const { data: wallet, isLoading } = useWallet()
  const balance = wallet?.balance ?? 0
  const schema = useMemo(() => withdrawSchema(balance), [balance])
  const withdraw = useWithdraw()
  const [withdrawnAmount, setWithdrawnAmount] = useState<number | null>(null)
  const form = useForm<WithdrawFormValues>({ resolver: zodResolver(schema), defaultValues: { amount: '', pin: '' }, mode: 'onChange' })
  const [rawAmount, pin] = useWatch({ control: form.control, name: ['amount', 'pin'] })
  const amount = Number(rawAmount) || 0
  const fees = transferCharge(amount) + stampDuty(amount)
  const validAmount = amount >= MIN_WITHDRAWAL && amount + fees <= balance

  const onSubmit = form.handleSubmit(values => {
    withdraw.mutate({ amount: Number(values.amount), pin: values.pin }, {
      onSuccess: ({ amount: sent }) => setWithdrawnAmount(sent),
      onError: error => { form.setValue('pin', ''); toast.error(errorMessage(error)) },
    })
  })

  return {
    isLoading: isLoading || !wallet,
    account: wallet?.withdrawalAccount ?? null,
    hasWallet: Boolean(wallet?.walletBankId),
    balanceLabel: formatBalance(balance),
    minimumLabel: formatNaira(MIN_WITHDRAWAL),
    amountField: form.register('amount'),
    amountError: form.formState.errors.amount?.message,
    pin,
    setPin: (value: string) => form.setValue('pin', value, { shouldValidate: true }),
    pinError: form.formState.errors.pin?.message,
    feesLabel: amount > 0 ? formatNaira(fees) : null,
    totalLabel: amount > 0 ? formatNaira(amount + fees) : null,
    withdrawAll: () => form.setValue('amount', String(Math.max(Math.floor(balance - transferCharge(balance) - stampDuty(balance)), 0)), { shouldValidate: true }),
    submitLabel: amount >= MIN_WITHDRAWAL ? formatNaira(amount) : 'funds',
    canSubmit: validAmount && pin.length === 4,
    submitting: withdraw.isPending,
    onSubmit,
    withdrawnLabel: withdrawnAmount !== null ? formatNaira(withdrawnAmount) : null,
    backToWallet: () => navigate(paths.wallet),
    addAccount: () => navigate(settingsPath('Payments & KYC')),
  }
}
