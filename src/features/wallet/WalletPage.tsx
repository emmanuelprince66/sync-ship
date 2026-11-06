import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/common'
import { Icon } from '@/components/ui/Icon'
import { WalletOverviewSkeleton } from './components/WalletSkeletons'
import { BankSwitcher } from './components/BankSwitcher'
import { TransactionRow } from './components/TransactionRow'
import { useWalletOverview } from './hooks/useWalletOverview'

export default function WalletPage() {
  const { wallet, isLoading, balanceLabel, goToWithdraw, goToFund, editWithdrawalAccount, recentTransactions, banks, viewAllTransactions } = useWalletOverview()

  if (isLoading || !wallet) return <WalletOverviewSkeleton/>
  const account = wallet.withdrawalAccount

  return <div className="space-y-6">
    <PageHeader className="flex flex-wrap items-center justify-between gap-3" title="Wallet" subtitle="Manage your earnings, delivery spend, and withdrawals." actions={<BankSwitcher options={banks.options} selectedId={banks.selectedId} onSelect={banks.select}/>}/>
    <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
      <div className="relative overflow-hidden rounded-3xl bg-[#09261C] p-7 text-white">
        <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full border-[35px] border-[#529661]/20"/>
        <div className="text-xs font-semibold text-white/60">Available balance</div>
        <div className="mt-3 text-[34px] font-black tracking-[-1px]">{balanceLabel}</div>
        <div className="mt-8 flex gap-3"><Button variant="secondary" onClick={goToWithdraw}>Withdraw funds</Button><Button onClick={goToFund} className="border border-white/20 bg-white/10 shadow-none hover:bg-white/15">Fund wallet</Button></div>
      </div>
      <div className="rounded-3xl border border-[#E0E8E3] bg-white p-6">
        <div className="flex items-center justify-between"><div className="text-sm font-extrabold text-[#17382C]">Withdrawal account</div><button type="button" onClick={editWithdrawalAccount} className="text-[10px] font-extrabold text-[#438352]">{account ? 'Edit' : 'Add'}</button></div>
        {account ? <>
          <div className="mt-6 flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF5E9] text-[#438352]"><Icon name="bank" size={21}/></div><div className="min-w-0"><div className="truncate text-xs font-extrabold text-[#28483B]">{account.bank} · {account.maskedNumber}</div><div className="mt-1 truncate text-[10px] text-[#87968F]">{account.accountName}</div></div></div>
          {account.verified && <div className="mt-5 flex items-center gap-2 rounded-lg bg-[#F1F7F1] px-3 py-2 text-[10px] font-bold text-[#4D7656]"><Icon name="shield" size={14}/>Account verified</div>}
        </> : <div className="mt-6 rounded-2xl border border-dashed border-[#C9D8CF] bg-[#FAFCFA] p-4 text-[11px] leading-5 text-[#708179]">No settlement account yet. Add one in Settings › Payments so you can withdraw.<button type="button" onClick={editWithdrawalAccount} className="mt-3 flex items-center gap-1 text-[11px] font-extrabold text-[#438352]">Add settlement account <Icon name="arrow" size={14}/></button></div>}
      </div>
    </div>
    <div className="rounded-2xl border border-[#E2EAE5] bg-white p-6">
      <div className="flex items-center justify-between"><div className="text-sm font-extrabold text-[#17382C]">Recent transactions</div>{recentTransactions.length > 0 && <button type="button" onClick={viewAllTransactions} className="flex items-center gap-1 text-xs font-extrabold text-[#438352]">View all <Icon name="arrow" size={15}/></button>}</div>
      {recentTransactions.length === 0
        ? <div className="py-6 text-center text-xs text-[#91A098]">No transactions yet</div>
        : recentTransactions.map(transaction => <TransactionRow key={transaction.id} transaction={transaction}/>)}
    </div>
  </div>
}
