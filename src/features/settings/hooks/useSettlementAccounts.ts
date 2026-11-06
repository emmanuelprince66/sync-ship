import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useAddSettlementAccount, useBankList, useDeleteSettlementAccount, useResolveAccountName, useSettlementAccounts, type SettlementAccount } from '@/api/banks'
import { useDisclosure } from '@/hooks/useDisclosure'
import { addBankDefaults, addBankSchema, type AddBankValues } from '../schemas'

/** Settlement account list with delete confirmation (sink-inventory Settings › Bank). */
export const useSettlementAccountsCard = () => {
  const accounts = useSettlementAccounts()
  const remove = useDeleteSettlementAccount()
  const addModal = useDisclosure()
  const [pendingDelete, setPendingDelete] = useState<SettlementAccount | null>(null)

  const confirmDelete = () => {
    if (!pendingDelete) return
    remove.mutate(pendingDelete.id, {
      onSuccess: () => { toast.success('Bank account removed'); setPendingDelete(null) },
      onError: error => toast.error(errorMessage(error)),
    })
  }

  return {
    accounts: accounts.data ?? [],
    isLoading: accounts.isLoading,
    addModal,
    pendingDelete,
    askDelete: setPendingDelete,
    cancelDelete: () => setPendingDelete(null),
    confirmDelete,
    deleting: remove.isPending,
  }
}

/**
 * Add-account form: pick a bank, type the 10-digit number, and the account
 * name is looked up (wallet/beneficiary_enquiry) so it can't be mistyped.
 */
export const useAddBankForm = (onDone: () => void) => {
  const banks = useBankList()
  const resolve = useResolveAccountName()
  const add = useAddSettlementAccount()
  const form = useForm<AddBankValues>({ resolver: zodResolver(addBankSchema), defaultValues: addBankDefaults })
  const [bankCode, accountNumber] = useWatch({ control: form.control, name: ['bankCode', 'accountNumber'] })
  const [showCharges, setShowCharges] = useState(false)
  const { mutate: lookup, reset: resetLookup } = resolve

  // Look the name up as soon as a bank and a full account number are in.
  useEffect(() => {
    if (!bankCode || !/^\d{10}$/.test(accountNumber)) {
      resetLookup()
      return
    }
    lookup({ bankCode, accountNumber }, {
      onSuccess: name => form.setValue('accountName', name, { shouldValidate: true }),
      onError: () => form.setValue('accountName', ''),
    })
  }, [bankCode, accountNumber, lookup, resetLookup, form])

  const submit = form.handleSubmit(values => {
    const bank = banks.data?.find(option => option.code === values.bankCode)
    const hasCharges = values.minFee !== '' && values.maxFee !== '' && values.percentage !== ''
    add.mutate({
      bankName: bank?.name ?? values.bankCode,
      accountNumber: values.accountNumber,
      accountName: values.accountName.trim(),
      fees: hasCharges ? { minFee: Number(values.minFee), maxFee: Number(values.maxFee), percentage: Number(values.percentage) } : undefined,
    }, {
      onSuccess: () => { toast.success('Bank account added'); form.reset(addBankDefaults); setShowCharges(false); onDone() },
      onError: error => toast.error(errorMessage(error)),
    })
  })

  return {
    form,
    bankOptions: (banks.data ?? []).map(bank => ({ value: bank.code, label: bank.name })),
    banksLoading: banks.isLoading,
    lookup: { pending: resolve.isPending, failed: resolve.isError, name: resolve.data ?? null },
    /** Only digits, max 10. */
    onAccountNumberInput: (value: string) => form.setValue('accountNumber', value.replace(/\D/g, '').slice(0, 10), { shouldValidate: value.length >= 10 }),
    showCharges,
    toggleCharges: () => setShowCharges(open => !open),
    submit,
    saving: add.isPending,
  }
}
