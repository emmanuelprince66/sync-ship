import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { Modal, ModalTitle } from '@/components/ui/Modal'
import { OptionSelect } from '@/components/ui/OptionSelect'
import { OtpInput } from '@/components/ui/OtpInput'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { formatBalance } from '../format'
import { useTransferFlow } from '../hooks/useTransferFlow'
import type { ReceiptDetails } from '../types'

type TransferModalProps = { open: boolean; bankId: string | null; senderName: string; fromLabel: string; onClose: () => void; onDone: (receipt: ReceiptDetails) => void }

function SummaryLine({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <div className={cn('flex items-center justify-between gap-3 text-xs', strong && 'border-t border-[#DEE8E1] pt-3')}><span className="text-[#7D8D85]">{label}</span><span className={cn('text-right', strong ? 'text-sm font-black text-[#17382C]' : 'font-extrabold text-[#193C2E]')}>{value}</span></div>
}

/** "Transfer Money" — sink's two-step transfer with recent beneficiaries, enquiry and PIN. */
export function TransferModal(props: TransferModalProps) {
  const flow = useTransferFlow(props)

  return <Modal open={props.open} onClose={flow.close} overlayClassName="bg-[#09261C]/40 p-0 backdrop-blur-[2px] sm:p-4" panelClassName="flex h-[100dvh] w-full flex-col bg-white shadow-[0_25px_80px_rgba(9,38,28,.2)] sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:max-w-lg sm:rounded-3xl">
    <div className="flex shrink-0 items-center gap-3 border-b border-[#EDF1EF] px-5 py-4">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#09261C] text-white"><Icon name="send" size={17}/></span>
      <div className="flex-1"><ModalTitle className="text-lg font-black text-[#17382C]">Transfer money</ModalTitle><p className="text-[11px] text-[#829189]">Step {flow.step} of 2</p></div>
      <button type="button" aria-label="Close" onClick={flow.close} className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E0E8E3]"><Icon name="close" size={17}/></button>
    </div>
    <div className="flex shrink-0 gap-2 px-5 pt-4">{flow.progress.map((done, index) => <span key={index} className={cn('h-1 flex-1 rounded-full', done ? 'bg-[#529661]' : 'bg-[#E3EAE6]')}/>)}</div>

    <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
      {flow.step === 1 ? <>
        {(flow.recent.loading || flow.recent.rows.length > 0) && <div>
          <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-[#829189]">Recent beneficiaries</p>
          {flow.recent.loading
            ? <div className="flex gap-2">{Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-16 w-36 rounded-xl"/>)}</div>
            : <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">{flow.recent.rows.map(row => {
              const active = row.accountNumber === flow.accountNumber
              return <button key={`${row.bankCode}-${row.accountNumber}`} type="button" onClick={() => flow.recent.apply(row)} className={cn('w-40 shrink-0 rounded-xl border p-3 text-left transition', active ? 'border-[#529661] bg-[#F5FAF4]' : 'border-[#E2E9E5] hover:border-[#BFD9C3]')}>
                <span className="block truncate text-[11px] font-extrabold text-[#28483B]">{row.accountName || 'Beneficiary'}</span>
                <span className="mt-1 block truncate text-[10px] text-[#87968F]">{row.bankName} · {row.accountNumber}</span>
              </button>
            })}</div>}
        </div>}

        <OptionSelect label="Beneficiary bank" placeholder={flow.bank.loading ? 'Loading banks…' : 'Select a bank'} options={flow.bank.options} value={flow.bank.value} onChange={event => flow.bank.set(event.target.value)}/>

        <div>
          <span className="mb-2 block text-[12px] font-extrabold text-[#34483F]">Account number</span>
          <div className="flex gap-2">
            <input value={flow.accountNumber} onChange={event => flow.setAccountNumber(event.target.value)} inputMode="numeric" placeholder="Enter account number" aria-label="Account number"
              className="h-12 min-w-0 flex-1 rounded-xl border border-[#DCE7E0] bg-white px-3.5 text-sm font-semibold text-[#09261C] outline-none transition placeholder:font-medium placeholder:text-[#9AABA3] focus:border-[#529661] focus:ring-4 focus:ring-[#529661]/10"/>
            <Button variant="outline" onClick={flow.verify} disabled={!flow.canVerify} loading={flow.verifying} className="h-12 shrink-0">Verify</Button>
          </div>
        </div>

        {flow.beneficiary?.name && <div className="flex items-center gap-2 rounded-xl bg-[#EDF7EC] px-4 py-3 text-xs font-extrabold text-[#3C7F4C]"><Icon name="check" size={15} stroke={2.5}/>{flow.beneficiary.name}<span className="truncate font-semibold text-[#7D8D85]">· {flow.bankName}</span></div>}
        {flow.enquiryFailed && <p className="rounded-xl bg-[#FDECEA] px-3 py-2 text-xs font-semibold text-[#C2483D]">We couldn't verify this account. Check the bank and account number.</p>}
      </> : <>
        <div>
          <span className="mb-2 block text-[12px] font-extrabold text-[#34483F]">From account</span>
          <div className="rounded-xl border border-[#DCE7E0] bg-[#F7FAF8] px-4 py-3 text-xs font-bold text-[#34483F]">{flow.fromLabel}</div>
        </div>
        <Field label="Amount (₦)" type="number" inputMode="decimal" min="0.01" placeholder="0.00" value={flow.amount} onValueChange={flow.setAmount} className="[&_input]:text-lg"/>
        <OptionSelect label="Category (optional)" placeholder={flow.categories.loading ? 'Loading categories…' : 'Select a category'} options={flow.categories.options} value={flow.categories.value} onChange={event => flow.categories.set(event.target.value)} required={false}/>
        <Field label="Narration (optional)" placeholder="What is this payment for?" value={flow.narration} onValueChange={flow.setNarration}/>

        <div className="space-y-3 rounded-2xl bg-[#F2F7F3] p-4">
          <SummaryLine label="Beneficiary" value={`${flow.beneficiary?.name ?? ''} · ${flow.bankName}`}/>
          <SummaryLine label="Account number" value={flow.accountNumber}/>
          <SummaryLine label="Amount" value={formatBalance(Number(flow.amount) || 0)}/>
          <SummaryLine label="Transfer fee" value={formatBalance(flow.charge)}/>
          <SummaryLine label="Total" value={formatBalance(flow.total)} strong/>
        </div>

        <div>
          <p className="text-center text-[11px] font-extrabold uppercase tracking-wide text-[#829189]">Enter transaction PIN</p>
          <div className="mx-auto max-w-[260px] [&>div]:mt-3"><OtpInput value={flow.pin} onChange={flow.setPin} length={4}/></div>
        </div>
      </>}

      {flow.error && <p role="alert" className="rounded-xl bg-[#FDECEA] px-3 py-2 text-xs font-semibold text-[#C2483D]">{flow.error}</p>}
    </div>

    <div className="flex shrink-0 gap-3 border-t border-[#EDF1EF] px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      {flow.step === 1
        ? <Button onClick={flow.continueTransfer} disabled={!flow.beneficiary?.name} className="h-12 flex-1">Continue</Button>
        : <>
          <Button variant="outline" onClick={flow.back} className="h-12">Back</Button>
          <Button onClick={flow.submit} disabled={flow.pin.length !== 4} loading={flow.submitting} icon="send" className="h-12 flex-1">{flow.submitting ? 'Processing…' : `Send ${formatBalance(Number(flow.amount) || 0)}`}</Button>
        </>}
    </div>
  </Modal>
}
