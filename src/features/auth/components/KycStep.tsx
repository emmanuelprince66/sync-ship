import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { useKycStep } from '../hooks/useKycStep'

export function KycStep() {
  const { benefits, kycRequested, startKyc, finish } = useKycStep()
  return <>
    <div className="mt-7 rounded-3xl border border-[#DCE7E0] bg-[#F8FAF8] p-6">
      <div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E5F3E2] text-[#438352]"><Icon name="shield" size={23}/></div><div><div className="text-sm font-extrabold text-[#28483B]">Business verification</div><div className="mt-1 text-[11px] leading-5 text-[#75877E]">Submit your CAC document and owner ID to increase payouts and transaction limits.</div></div></div>
      <div className="mt-5 space-y-2">{benefits.map(item => <div key={item} className="flex items-center gap-2 text-[11px] font-bold text-[#52695D]"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E0F0DE] text-[#438352]"><Icon name="check" size={11} stroke={3}/></span>{item}</div>)}</div>
    </div>
    {kycRequested
      ? <div className="mt-5 rounded-2xl bg-[#EDF7EC] p-5 text-center" role="status"><div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#438352]"><Icon name="check" size={19}/></div><div className="mt-3 text-xs font-extrabold text-[#315A3E]">KYC request started</div><div className="mt-1 text-[10px] text-[#718279]">You can upload your documents from Settings after setup.</div></div>
      : <Button variant="outline" icon="shield" onClick={startKyc} className="mt-5 w-full py-3">Start KYC verification</Button>}
    <Button onClick={finish} className="mt-5 w-full py-3.5">{kycRequested ? 'Finish setup' : 'Continue to dashboard'}</Button>
    <button type="button" onClick={finish} className="mt-3 w-full text-center text-[11px] font-bold text-[#829189]">I’ll complete KYC later</button>
  </>
}
