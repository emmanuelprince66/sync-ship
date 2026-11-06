import { Link } from 'react-router'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { Modal, ModalFooter, ModalHeader } from '@/components/ui/Modal'
import { paths } from '@/routes/paths'
import { useSubAccountForm } from '../hooks/useSubAccountForm'
import type { WalletPageModel } from '../hooks/useWalletPage'

const panel = 'max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-[0_25px_80px_rgba(9,38,28,.2)]'

/** sink: "Fund Account" — transfer details for the selected account + copy. */
export function FundModal({ page }: { page: WalletPageModel }) {
  return <Modal open={page.modal === 'fund'} onClose={page.closeModal} panelClassName={panel}>
    <ModalHeader title="Fund account" description="Make a bank transfer to the account below. Your balance updates as soon as it arrives." align="start" onClose={page.closeModal}/>
    <div className="mt-6 rounded-2xl bg-[#09261C] p-5 text-white">
      <p className="text-[10px] font-bold uppercase tracking-[.12em] text-white/55">{page.banner.kind === 'Current' ? 'Current account' : 'Sub account'}</p>
      <p className="mt-2 text-base font-extrabold">{page.banner.accountName}</p>
      <p className="mt-4 text-[26px] font-black tracking-[.06em]">{page.fund.accountNumber || 'Nil'}</p>
      <p className="mt-1 text-xs text-white/70">{page.banner.bankName}</p>
    </div>
    <div className="mt-5 grid grid-cols-2 gap-3">
      <Button variant="outline" icon={page.fund.copied ? 'check' : 'copy'} onClick={page.fund.copyAccountNumber} disabled={!page.fund.accountNumber}>{page.fund.copied ? 'Copied' : 'Copy number'}</Button>
      <Button onClick={page.closeModal}>Done</Button>
    </div>
  </Modal>
}

/** sink: "Generate Report" — exports the current filtered transactions. */
export function ReportModal({ page }: { page: WalletPageModel }) {
  return <Modal open={page.modal === 'report'} onClose={page.closeModal} panelClassName={panel}>
    <ModalHeader title="Generate report" description="Export the transactions that match your current filters." align="start" onClose={page.closeModal}/>
    <div className="mt-6 rounded-2xl bg-[#F2F7F3] p-4 text-xs leading-5 text-[#60736A]">
      <div className="flex items-center gap-2 font-extrabold text-[#28483B]"><Icon name="download" size={15}/>Statement · CSV</div>
      <p className="mt-1">Includes ID, customer, type, channel, BNPL, amount, account, date, status and description for the selected account{page.filters.startDate || page.filters.endDate ? ' and date range' : ''}.</p>
    </div>
    <ModalFooter className="mt-6"><Button variant="ghost" onClick={page.closeModal}>Cancel</Button><Button icon="download" onClick={page.exportReport}>Generate report</Button></ModalFooter>
  </Modal>
}

/** sink: "Create Sub Account". */
export function SubAccountModal({ page }: { page: WalletPageModel }) {
  const form = useSubAccountForm({ businessId: page.businessId, onDone: page.closeModal })
  const close = () => { form.reset(); page.closeModal() }
  return <Modal open={page.modal === 'subAccount'} onClose={close} panelClassName={panel}>
    <ModalHeader title="Create sub account" description="Enter your previous account number and branch name to create a sub account." align="start" onClose={close}/>
    <form onSubmit={form.onSubmit} noValidate className="mt-6 space-y-4">
      <Field label="Previous account number" placeholder="Enter previous account number" inputMode="numeric" error={form.errors.previousAccount?.message} {...form.register('previousAccount')}/>
      <Field label="Branch name" placeholder="Enter branch name" error={form.errors.branch?.message} {...form.register('branch')}/>
      <Button type="submit" loading={form.submitting} className="h-12 w-full">Create sub account</Button>
    </form>
  </Modal>
}

/** sink: shown when the business has no KYC — history is visible, actions need verification. */
export function KycPromptModal({ page }: { page: WalletPageModel }) {
  return <Modal open={page.modal === 'kyc'} onClose={page.closeModal} panelClassName={panel}>
    <ModalHeader title="Complete your KYC verification" description="Verify your business to unlock transaction actions." align="start" onClose={page.closeModal}/>
    <p className="mt-5 text-sm leading-6 text-[#60736A]">Your transaction history is available, but you need to complete your business KYC verification before you can transfer funds, fund an account, or use other transaction actions.</p>
    <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <Button variant="outline" onClick={page.closeModal}>Maybe later</Button>
      <Link to={paths.kyc} onClick={page.closeModal} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#09261C] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#123D2E]"><Icon name="shield" size={17}/>Complete KYC</Link>
    </div>
  </Modal>
}
