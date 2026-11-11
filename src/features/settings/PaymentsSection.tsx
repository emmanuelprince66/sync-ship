import type { PaymentSettings } from '@/api/types'
import { SegmentedTabs } from '@/components/ui/common'
import { Icon } from '@/components/ui/Icon'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import { Toggle } from '@/components/ui/Toggle'
import { KycCard } from './components/payments/KycCard'
import { usePaymentsSection } from './hooks/usePaymentsSection'
import { SaveBar, SectionHeading } from './shared'

const CHARGE_OPTIONS = [{ value: 'customer', label: 'Customer pays fees' }, { value: 'business', label: 'I absorb fees' }] as const

function OptionCardsSkeleton() {
  return <SkeletonGroup label="Loading payment settings" className="mt-6 grid gap-4 md:grid-cols-2">
    {[0, 1].map(index => <div key={index} className="rounded-2xl border border-[#E2E9E5] p-5"><div className="flex justify-between"><Skeleton className="h-10 w-10 rounded-xl"/><Skeleton className="h-6 w-11 rounded-full"/></div><Skeleton className="mt-4 h-3 w-36"/><Skeleton className="mt-2 h-2.5 w-full"/></div>)}
  </SkeletonGroup>
}

export function PaymentsSection({ initial }: { initial: PaymentSettings }) {
  const { isLoading, draft, setOnline, setChargesPaidBy, setWallet, save, saving, kyc, walletReadOnly, walletActive } = usePaymentsSection(initial)

  return <>
    <SectionHeading title="Online payments & KYC" description="Accept customer payments, access your wallet, and manage settlements."/>

    {isLoading || !draft ? <OptionCardsSkeleton/> : <div className="mt-6 grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-[#E2E9E5] p-5">
        <div className="flex items-start justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF5E9] text-[#438352]"><Icon name="card" size={19}/></div><Toggle label="Online customer payments" enabled={draft.online} onChange={setOnline}/></div>
        <div className="mt-4 text-xs font-extrabold text-[#304B40]">Online customer payments</div>
        <div className="mt-1 text-[10px] leading-4 text-[#8A9891]">Accept cards, transfers, and USSD on storefront orders.{!kyc.verified && ' Requires KYC Tier 1.'}</div>
        {draft.online && <div className="mt-4">
          <div className="mb-2 text-[10px] font-extrabold uppercase tracking-[.08em] text-[#75877E]">Transaction charges</div>
          <SegmentedTabs value={draft.chargesPaidBy} onChange={setChargesPaidBy} options={CHARGE_OPTIONS} className="grid grid-cols-2 gap-1 rounded-xl bg-[#EFF4F1] p-1" buttonClassName="rounded-lg px-2 py-2 text-[10px] font-extrabold transition"/>
        </div>}
      </div>
      <div className="rounded-2xl border border-[#E2E9E5] p-5">
        <div className="flex items-start justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF5E9] text-[#438352]"><Icon name="wallet" size={19}/></div>{walletReadOnly ? <span className={walletActive ? 'rounded-full bg-[#E4F2E1] px-2.5 py-1 text-[9px] font-extrabold text-[#438352]' : 'rounded-full bg-[#FFF0D0] px-2.5 py-1 text-[9px] font-extrabold text-[#956616]'}>{walletActive ? 'Active' : 'Opens after KYC'}</span> : <Toggle label="SyncShip wallet" enabled={draft.wallet} onChange={setWallet}/>}</div>
        <div className="mt-4 text-xs font-extrabold text-[#304B40]">SyncShip wallet</div>
        <div className="mt-1 text-[10px] leading-4 text-[#8A9891]">Receive sales revenue and pay delivery fees from your balance.</div>
      </div>
    </div>}

    <div className="mt-5"><KycCard kyc={kyc} onOpen={kyc.open}/></div>

    <SaveBar saving={saving} onSave={save}/>
  </>
}
