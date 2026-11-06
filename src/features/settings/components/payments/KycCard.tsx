import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'

type KycSummary = { started: boolean; verified: boolean; fullyVerified: boolean; tierLabel: string | null; limit: string; badge: string }

/** Design's "Business KYC verification" card, now driven by the wallet's real tier. */
export function KycCard({ kyc, onOpen }: { kyc: KycSummary; onOpen: () => void }) {
  return <div className="rounded-2xl border border-[#DDE7E1] bg-[#F8FAF8] p-5">
    <div className="flex items-start gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E5F3E2] text-[#438352]"><Icon name="shield" size={21}/></div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2"><div className="text-sm font-extrabold text-[#28483B]">Business KYC verification</div><span className={cn('rounded-full px-2.5 py-1 text-[9px] font-extrabold', kyc.verified ? 'bg-[#DFF0DC] text-[#397A48]' : kyc.started ? 'bg-[#E8F0FC] text-[#426AB2]' : 'bg-[#FFF0D0] text-[#956616]')}>{kyc.badge}</span></div>
        <div className="mt-1 text-[10px] leading-4 text-[#75877E]">Verify your identity and business to move money, withdraw funds, and unlock higher limits.</div>
        <div className="mt-3 flex items-center gap-1.5 text-[10px] font-extrabold text-[#477952]"><Icon name="wallet" size={13}/>{kyc.limit}</div>
        <Button variant={kyc.fullyVerified ? 'outline' : kyc.started ? 'secondary' : 'primary'} icon="shield" onClick={onOpen} className="mt-4 py-2 text-xs">{kyc.fullyVerified ? 'View verification' : kyc.started ? 'Continue verification' : 'Start KYC'}</Button>
      </div>
    </div>
  </div>
}
