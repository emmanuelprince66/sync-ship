import { Icon, type IconName } from '@/components/ui/Icon'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { accountInitials, formatBalance, maskAccount } from '../format'
import type { WalletPageModel } from '../hooks/useWalletPage'

/** One card per bank account; the selected one is tinted. Owners can switch (sink: account strip). */
export function AccountCards({ page }: { page: WalletPageModel }) {
  if (page.loading && !page.accounts.length) return <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">{Array.from({ length: 2 }, (_, index) => <Skeleton key={index} className="h-[150px] w-[280px] shrink-0 rounded-2xl"/>)}</div>
  if (!page.accounts.length) return null
  return <section className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" aria-label="Accounts">
    {page.accounts.map(account => {
      const selected = page.selectedId === account.id
      return <button key={account.id} type="button" onClick={() => page.selectAccount(account.id)} disabled={!page.canSwitchBanks && !selected} aria-pressed={selected}
        className={cn('min-h-[150px] w-[280px] shrink-0 snap-start rounded-2xl border p-5 text-left transition sm:w-[320px] lg:w-[calc((100%-2.25rem)/4)]', selected ? 'border-[#BFD9C3] bg-[#EEF8EC] shadow-sm' : 'border-[#E2EAE5] bg-white hover:border-[#529661]', page.canSwitchBanks ? 'cursor-pointer' : 'cursor-default')}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#286B43] text-xs font-black text-white ring-2 ring-[#286B43]/15">{accountInitials(account.bank_name)}</span>
            <span className="min-w-0 truncate text-[10px] font-extrabold uppercase tracking-wider text-[#829189]" title={page.accountLabel(account)}>{page.accountLabel(account)}</span>
          </div>
          <span className="shrink-0 text-[#829189]"><Icon name="wallet" size={18}/></span>
        </div>
        <p className="mt-5 text-xl font-black text-[#09261C]">{formatBalance(selected ? page.banner.balance : 0)}</p>
        <p className="mt-1 truncate text-xs font-semibold text-[#34483F]" title={account.account_name || 'Bank account'}>{account.account_name || 'Bank account'}</p>
        <p className="mt-1 truncate text-[10px] text-[#829189]">{account.bank_name || 'Bank'} · {maskAccount(account.account_number)}</p>
      </button>
    })}
  </section>
}

function BannerAction({ icon, label, onClick }: { icon: IconName; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-xs font-extrabold text-white transition-colors hover:bg-white/20">
    <Icon name={icon} size={16}/>{label}
  </button>
}

/** Selected account + available balance + actions (sink: dark account banner). */
export function AccountBanner({ page, onManage }: { page: WalletPageModel; onManage: () => void }) {
  const { banner } = page
  return <section className="relative overflow-hidden rounded-3xl bg-[#09261C] p-5 text-white sm:p-7">
    <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full border-[35px] border-[#529661]/20"/>
    <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10"><Icon name="bank" size={20}/></span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><p className="max-w-[260px] truncate text-sm font-extrabold" title={banner.accountName}>{banner.accountName}</p><span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold">{banner.kind}</span></div>
          <p className="mt-1 truncate text-xs text-white/70">{banner.bankName} · {banner.accountNumber}</p>
          <p className="mt-0.5 truncate text-xs text-white/55">{banner.holderName}</p>
        </div>
      </div>
      <div className="lg:text-right">
        <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-white/55">Available balance</p>
        {page.loading ? <Skeleton className="mt-2 h-9 w-48 bg-white/10"/> : <p className="mt-1 text-3xl font-black tracking-[-1px] sm:text-[34px]">{formatBalance(banner.balance)}</p>}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:justify-end">
        {page.permissions.canInitiateTransfer && <BannerAction icon="send" label="Transfer" onClick={() => page.openModal('transfer')}/>}
        <BannerAction icon="plus" label="Fund" onClick={() => page.openModal('fund')}/>
        <BannerAction icon="download" label="Report" onClick={() => page.openModal('report')}/>
        <BannerAction icon="settings" label="Manage" onClick={onManage}/>
      </div>
    </div>
  </section>
}

/** Inflow / outflow for the selected date range (sink: two tinted cards). */
export function FlowCards({ page }: { page: WalletPageModel }) {
  const card = (kind: 'in' | 'out') => {
    const inflow = kind === 'in'
    return <div className={cn('rounded-2xl border p-5', inflow ? 'border-[#CFE0F5] bg-[#EEF4FC]' : 'border-[#F5D6D1] bg-[#FDF1EF]')}>
      <div className={cn('flex items-center gap-3 text-sm font-extrabold', inflow ? 'text-[#2F5FA8]' : 'text-[#B9473C]')}>
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-full text-white', inflow ? 'bg-[#3E6FBE]' : 'bg-[#D15B50]')}><Icon name={inflow ? 'arrowIn' : 'arrowOut'} size={16}/></span>
        Main account {inflow ? 'inflow' : 'outflow'}
      </div>
      {page.loading ? <Skeleton className="mt-5 h-8 w-40"/> : <p className="mt-5 text-2xl font-black text-[#09261C] sm:text-3xl">{formatBalance(inflow ? page.inflow : page.outflow)}</p>}
      <p className="mt-1 text-xs text-[#829189]">Selected date range</p>
    </div>
  }
  return <section className="grid gap-4 lg:grid-cols-2">{card('in')}{card('out')}</section>
}
