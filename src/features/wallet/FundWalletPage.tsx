import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { BackLink } from '@/components/ui/misc'
import { WalletFormSkeleton } from './components/WalletSkeletons'
import { FUND_STEPS, useFundWallet } from './hooks/useFundWallet'

export default function FundWalletPage() {
  const { account, isLoading, hasAccount, copied, copyAccountNumber, backToWallet, goToKyc } = useFundWallet()

  if (isLoading || !account) return <WalletFormSkeleton/>
  if (!hasAccount) return <div className="mx-auto max-w-2xl">
    <BackLink label="Back to wallet" onClick={backToWallet}/>
    <div className="rounded-3xl border border-[#E0E8E3] bg-white p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF5E9] text-[#438352]"><Icon name="shield" size={24}/></div>
      <div className="mt-5 text-lg font-black text-[#17382C]">Verify your business to get a wallet account</div>
      <div className="mx-auto mt-2 max-w-sm text-xs leading-5 text-[#798A81]">Your dedicated account number is created once you complete KYC. You can then fund your wallet from any Nigerian bank.</div>
      <Button icon="shield" onClick={goToKyc} className="mt-6">Start KYC</Button>
    </div>
  </div>

  return <div className="mx-auto max-w-2xl">
    <BackLink label="Back to wallet" onClick={backToWallet}/>
    <div className="rounded-3xl border border-[#E0E8E3] bg-white p-6 md:p-8">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF5E9] text-[#438352]"><Icon name="bank" size={22}/></div>
      <div className="mt-5 text-xl font-black text-[#17382C]">Fund your wallet</div><div className="mt-1 text-xs leading-5 text-[#7C8D85]">Send money from any Nigerian bank to your dedicated virtual account. Your wallet will be credited automatically.</div>
      <div className="mt-7 rounded-2xl bg-[#09261C] p-6 text-white">
        <div className="text-[10px] font-bold uppercase tracking-[.12em] text-white/55">SyncShip virtual account</div>
        <div className="mt-4 flex items-end justify-between gap-3"><div><div className="text-[28px] font-black tracking-[.08em]">{account.number}</div><div className="mt-2 text-xs font-bold text-white/70">{account.name}</div></div><button type="button" aria-label="Copy account number" onClick={copyAccountNumber} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20"><Icon name={copied ? 'check' : 'copy'} size={18}/></button></div>
        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-xs"><span className="text-white/55">Bank</span><span className="font-extrabold">{account.bank}</span></div>
      </div>
      {copied && <div role="status" className="mt-3 rounded-xl bg-[#EAF5E9] px-4 py-3 text-center text-[11px] font-bold text-[#438352]">Virtual account number copied</div>}
      <div className="mt-7"><div className="text-xs font-extrabold text-[#28483B]">How it works</div><div className="mt-4 space-y-4">{FUND_STEPS.map((item, index) => <div key={item} className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EEF6ED] text-[10px] font-black text-[#438352]">{index + 1}</span><span className="text-xs font-semibold text-[#60736A]">{item}</span></div>)}</div></div>
      <div className="mt-7 flex items-start gap-2 rounded-xl border border-[#DDE8E0] bg-[#F8FAF8] p-4 text-[10px] leading-4 text-[#708179]"><Icon name="shield" size={16}/><span>Only transfers made to this account will fund your SyncShip wallet. Bank transfers typically arrive within a few seconds.</span></div>
    </div>
  </div>
}
