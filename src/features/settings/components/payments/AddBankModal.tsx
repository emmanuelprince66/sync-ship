import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { Modal, ModalFooter, ModalHeader } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAddBankForm } from '../../hooks/useSettlementAccounts'
import { OptionSelect } from '../OptionSelect'

function AddBankForm({ onClose }: { onClose: () => void }) {
  const { form, bankOptions, banksLoading, lookup, onAccountNumberInput, showCharges, toggleCharges, submit, saving } = useAddBankForm(onClose)
  const { register, formState: { errors } } = form
  const accountNumber = register('accountNumber')

  return <form onSubmit={submit} noValidate>
    <ModalHeader title="Add settlement account" description="Payouts and withdrawals are sent here." onClose={onClose}/>
    <div className="mt-6 space-y-4">
      {banksLoading ? <div><Skeleton className="mb-2 h-3 w-16"/><Skeleton className="h-12 rounded-xl"/></div> : <OptionSelect label="Bank" placeholder="Choose your bank" options={bankOptions} error={errors.bankCode?.message} {...register('bankCode')}/>}
      <Field label="Account number" inputMode="numeric" autoComplete="off" placeholder="10-digit NUBAN" error={errors.accountNumber?.message} {...accountNumber} onChange={undefined} onValueChange={onAccountNumberInput}/>
      <div>
        <Field label="Account name" placeholder={lookup.pending ? 'Checking account…' : 'Filled in automatically'} readOnly={lookup.pending} error={errors.accountName?.message} {...register('accountName')}/>
        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-bold" aria-live="polite">
          {lookup.pending && <span className="text-[#829189]">Verifying with the bank…</span>}
          {lookup.name && !lookup.pending && <span className="flex items-center gap-1 text-[#438352]"><Icon name="check" size={12} stroke={2.5}/>Verified account name</span>}
          {lookup.failed && <span className="text-[#A16A15]">Couldn’t verify — check the number or type the name exactly as the bank has it.</span>}
        </div>
      </div>

      <button type="button" onClick={toggleCharges} aria-expanded={showCharges} className="flex items-center gap-1 text-[11px] font-extrabold text-[#438352]"><span className={showCharges ? 'rotate-90 transition' : 'transition'}><Icon name="arrow" size={14}/></span>Transaction charges (optional)</button>
      {showCharges && <div className="rounded-2xl bg-[#F4F8F5] p-4">
        <div className="mb-3 text-[10px] leading-4 text-[#687A71]">Fee applied to payments into this account. Fill in all three, or leave them empty.</div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Percentage" inputMode="decimal" suffix="%" error={errors.percentage?.message} {...register('percentage')}/>
          <Field label="Minimum" inputMode="decimal" suffix="NGN" error={errors.minFee?.message} {...register('minFee')}/>
          <Field label="Cap" inputMode="decimal" suffix="NGN" error={errors.maxFee?.message} {...register('maxFee')}/>
        </div>
      </div>}
    </div>
    <ModalFooter>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button type="submit" loading={saving} disabled={lookup.pending}>Save account</Button>
    </ModalFooter>
  </form>
}

export function AddBankModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <Modal open={open} onClose={onClose} panelClassName="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-[0_25px_80px_rgba(9,38,28,.2)] sm:p-7">
    {open && <AddBankForm onClose={onClose}/>}
  </Modal>
}
