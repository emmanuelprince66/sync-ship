import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { extractTransactionId, transferCharge, useBeneficiaryEnquiry, useExpenseCategories, useRecentBeneficiaries, useTransfer, useTransferBanks, type RecentBeneficiary } from '@/api/transactions'
import type { ReceiptDetails } from '../types'

type Options = { open: boolean; bankId: string | null; senderName: string; fromLabel: string; onDone: (receipt: ReceiptDetails) => void; onClose: () => void }

/**
 * Two-step transfer, as in sink-inventory: (1) recent beneficiaries, bank, 10-digit
 * account number with automatic name enquiry; (2) amount, optional category and
 * narration, summary with sink's fee, 4-digit PIN. Same validation messages.
 */
export function useTransferFlow({ open, bankId, senderName, fromLabel, onDone, onClose }: Options) {
  const [step, setStep] = useState<1 | 2>(1)
  const [bankCode, setBankCode] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [narration, setNarration] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  const banks = useTransferBanks(open)
  const categories = useExpenseCategories(open && step === 2)
  const recent = useRecentBeneficiaries(bankId, open && step === 1)
  const enquiry = useBeneficiaryEnquiry(bankCode, accountNumber)
  const transfer = useTransfer()

  const bankOptions = useMemo(() => (banks.data ?? []).map(bank => ({ value: bank.code, label: bank.name })), [banks.data])
  const bankName = bankOptions.find(option => option.value === bankCode)?.label ?? ''
  const beneficiary = enquiry.data ?? null
  const charge = transferCharge(amount)

  const reset = () => {
    setStep(1); setBankCode(''); setAccountNumber(''); setAmount(''); setCategoryId(''); setNarration(''); setPin(''); setError('')
  }
  const close = () => { reset(); onClose() }

  /** Paid before? Fill bank + number; the name comes from a fresh enquiry, not the saved row. */
  const applyBeneficiary = (row: RecentBeneficiary) => {
    const match = bankOptions.find(option => row.bankCode && option.value === row.bankCode)
    if (match) setBankCode(match.value)
    setAccountNumber(row.accountNumber)
    setError('')
  }

  const continueTransfer = () => {
    if (!bankCode || accountNumber.length !== 10) return setError('Select a bank and enter a valid 10-digit account number.')
    if (!beneficiary?.name) return setError('Verify the beneficiary before continuing.')
    setError('')
    setStep(2)
  }

  const submit = () => {
    if (pin.length !== 4) return setError('Enter your 4-digit transaction PIN.')
    if (!bankId) return toast.error('Select an account before transferring')
    if (!(Number(amount) > 0)) return setError('Enter the amount to send.')
    transfer.mutate({ bankId, pin, ref: beneficiary?.ref ?? '', amount, narration, categoryId: categoryId || undefined }, {
      onSuccess: response => {
        const receipt: ReceiptDetails = {
          amount: Number(amount),
          senderName,
          beneficiaryName: beneficiary?.name,
          beneficiaryAccount: accountNumber,
          beneficiaryBank: bankName,
          narration,
          transactionId: extractTransactionId(response),
          date: new Date().toISOString(),
          status: 'Successful',
        }
        toast.success('Transfer successful')
        reset()
        onDone(receipt)
      },
      onError: transferError => setError(errorMessage(transferError, 'Transfer failed. Please try again.')),
    })
  }

  return {
    step,
    progress: [true, step === 2],
    bank: { options: bankOptions, loading: banks.isLoading, value: bankCode, set: (code: string) => { setBankCode(code); setError('') } },
    accountNumber,
    setAccountNumber: (value: string) => { setAccountNumber(value.replace(/\D/g, '').slice(0, 10)); setError('') },
    canVerify: Boolean(bankCode) && accountNumber.length === 10,
    verifying: enquiry.isFetching,
    verify: () => { void enquiry.refetch() },
    beneficiary,
    bankName,
    enquiryFailed: enquiry.isError && !enquiry.isFetching,
    recent: { rows: recent.data ?? [], loading: recent.isLoading, apply: applyBeneficiary },
    amount,
    setAmount,
    categories: { options: (categories.data ?? []).map(category => ({ value: category.id, label: category.name })), loading: categories.isLoading, value: categoryId, set: setCategoryId },
    narration,
    setNarration,
    pin,
    setPin,
    charge,
    total: (Number(amount) || 0) + charge,
    fromLabel,
    error,
    continueTransfer,
    back: () => { setStep(1); setError('') },
    submit,
    submitting: transfer.isPending,
    close,
  }
}

export type TransferFlow = ReturnType<typeof useTransferFlow>
