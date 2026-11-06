import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/Button'
import { Link } from 'react-router'
import { PendingBnplPanel } from '@/features/bnpl'
import { paths, settingsPath } from '@/routes/paths'
import { AccountBanner, AccountCards, FlowCards } from './components/AccountOverview'
import { FundModal, KycPromptModal, ReportModal, SubAccountModal } from './components/AccountModals'
import { ReceiptModal, TransactionDetailsModal } from './components/TransactionModals'
import { TransactionsSection } from './components/TransactionsSection'
import { TransferModal } from './components/TransferModal'
import { maskAccount } from './format'
import { useWalletPage } from './hooks/useWalletPage'

/** Wallet balance & transactions — sink-inventory's Transactions screen, in SyncShip's design. */
export default function WalletPage() {
  const page = useWalletPage()
  const navigate = useNavigate()
  const dateRange = { from: page.filters.startDate ? new Date(page.filters.startDate) : undefined, to: page.filters.endDate ? new Date(page.filters.endDate) : undefined }

  return <div className="space-y-5">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-xl font-black text-[#09261C]">Wallet</h2>
        <p className="mt-1 text-xs text-[#7C8D85]">{page.permissions.canManageBankDetails ? `${page.accounts.length} connected ${page.accounts.length === 1 ? 'account' : 'accounts'}` : 'Your balance and transactions'}</p>
      </div>
      {page.permissions.canManageBankDetails && <Button icon="plus" variant="outline" onClick={() => page.openModal('subAccount')} className="self-start sm:self-auto">Add account</Button>}
    </header>

    {page.permissions.canManageBankDetails && <AccountCards page={page}/>}
    {page.permissions.canManageBankDetails && <AccountBanner page={page} onManage={() => navigate(settingsPath('Payments & KYC'))}/>}
    <FlowCards page={page}/>
    {/* Pending Akawopay settlements — not in the balance yet, so kept apart from the cards above (as in sink). */}
    <PendingBnplPanel dateRange={dateRange}/>
    <TransactionsSection page={page}/>

    {page.needsKyc && <div className="flex justify-center pb-2"><Link to={paths.kyc} className="inline-flex items-center gap-2 rounded-xl bg-[#09261C] px-5 py-3 text-sm font-bold text-white hover:bg-[#123D2E]">Complete KYC verification</Link></div>}

    <TransferModal open={page.modal === 'transfer'} bankId={page.bankId} senderName={page.banner.accountName || page.walletAccountName} fromLabel={`${page.banner.accountName} · ${maskAccount(page.fund.accountNumber)}`} onClose={page.closeModal} onDone={receipt => { page.closeModal(); page.showReceipt(receipt) }}/>
    <FundModal page={page}/>
    <ReportModal page={page}/>
    <SubAccountModal page={page}/>
    <KycPromptModal page={page}/>
    <TransactionDetailsModal trx={page.details} onClose={page.closeDetails} onReceipt={page.showReceipt}/>
    <ReceiptModal receipt={page.receipt} onClose={page.closeReceipt}/>
  </div>
}
