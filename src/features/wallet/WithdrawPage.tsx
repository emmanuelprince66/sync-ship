import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { OtpInput } from '@/components/ui/OtpInput'
import { SuccessIcon, SummaryRow } from '@/components/ui/common'
import { BackLink } from '@/components/ui/misc'
import { WalletFormSkeleton } from './components/WalletSkeletons'
import { useWithdrawForm } from './hooks/useWithdrawForm'

export default function WithdrawPage() {
  const form = useWithdrawForm()

  if (form.isLoading) return <WalletFormSkeleton/>
  const { account } = form

  return <div className="mx-auto max-w-2xl">
    <BackLink label="Back to wallet" onClick={form.backToWallet}/>
    <div className="rounded-3xl border border-[#E0E8E3] bg-white p-6 md:p-8">
      {!account || !form.hasWallet ? <div className="py-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF5E9] text-[#438352]"><Icon name="bank" size={24}/></div>
        <div className="mt-5 text-lg font-black text-[#17382C]">{form.hasWallet ? 'Add a settlement account first' : 'Your wallet isn’t open yet'}</div>
        <div className="mx-auto mt-2 max-w-sm text-xs leading-5 text-[#798A81]">{form.hasWallet ? 'Withdrawals go to your settlement account. Add one in Settings › Payments & KYC.' : 'Complete KYC in Settings › Payments & KYC to open your wallet and withdraw.'}</div>
        <Button onClick={form.addAccount} className="mt-6">Go to Payments & KYC</Button>
      </div> : form.withdrawnLabel ? <div className="py-8 text-center">
        <SuccessIcon/>
        <div className="mt-6 text-xl font-black text-[#17382C]">Withdrawal sent</div>
        <div className="mx-auto mt-2 max-w-sm text-xs leading-5 text-[#798A81]">{form.withdrawnLabel} is on its way to your {account.bank} account. It should arrive within a few minutes.</div>
        <Button onClick={form.backToWallet} className="mt-7">Done</Button>
      </div> : <form onSubmit={form.onSubmit} noValidate>
        <div className="text-xl font-black text-[#17382C]">Withdraw funds</div><div className="mt-1 text-xs text-[#7C8D85]">Transfer your available balance to your verified bank account.</div>
        <div className="mt-7 rounded-2xl bg-[#F2F7F3] p-5"><div className="text-[10px] font-bold uppercase tracking-[.1em] text-[#7B8C83]">Available balance</div><div className="mt-2 text-2xl font-black text-[#17382C]">{form.balanceLabel}</div></div>
        <div className="mt-6">
          <Field label="Amount to withdraw" type="number" inputMode="numeric" placeholder="Enter amount" suffix="NGN" error={form.amountError} {...form.amountField}/>
          <div className="mt-2 flex justify-between text-[10px] text-[#829189]"><span>Minimum withdrawal: {form.minimumLabel}</span><button type="button" onClick={form.withdrawAll} className="font-extrabold text-[#438352]">Withdraw all</button></div>
        </div>
        <div className="mt-6"><div className="mb-2 text-[11px] font-extrabold text-[#34483F]">Destination account</div><div className="flex items-center gap-4 rounded-2xl border-2 border-[#529661] bg-[#F5FAF4] p-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#438352]"><Icon name="bank" size={20}/></div><div className="min-w-0 flex-1"><div className="truncate text-xs font-extrabold text-[#28483B]">{account.bank} · {account.maskedNumber}</div><div className="mt-1 truncate text-[10px] text-[#87968F]">{account.accountName}</div></div><span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#529661] text-white"><Icon name="check" size={11} stroke={3}/></span></div></div>
        {form.totalLabel && <div className="mt-6 space-y-3 rounded-2xl bg-[#F8FAF8] p-4"><SummaryRow label="Transfer charges" value={form.feesLabel}/><SummaryRow label="Total debit" value={form.totalLabel} labelClassName="font-bold text-[#547064]" valueClassName="font-black text-[#193C2E]"/></div>}
        <div className="mt-6">
          <div className="text-[12px] font-extrabold text-[#34483F]">Transaction PIN</div>
          <div className="max-w-xs [&>div]:mt-2"><OtpInput value={form.pin} onChange={form.setPin} length={4}/></div>
          {form.pinError && form.pin.length > 0 && <div role="alert" className="mt-1.5 text-[11px] font-semibold text-[#D15B50]">{form.pinError}</div>}
        </div>
        <div className="mt-6 rounded-xl bg-[#FFF8E8] p-4 text-[10px] leading-4 text-[#80662B]">Withdrawals are processed instantly. Your bank may take a few minutes to reflect the transfer.</div>
        <Button type="submit" loading={form.submitting} disabled={!form.canSubmit} className="mt-6 w-full">Withdraw {form.submitLabel}</Button>
      </form>}
    </div>
  </div>
}
