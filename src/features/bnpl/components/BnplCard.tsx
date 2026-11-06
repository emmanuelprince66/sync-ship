import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Modal, ModalHeader } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { Toggle } from '@/components/ui/Toggle'
import { cn } from '@/lib/cn'
import { BNPL_FEE_LABEL } from '../eligibility'
import { useBnplSetup } from '../hooks/useBnplSetup'
import { BnplTerms } from './BnplTerms'

/** Akawopay — Buy Now, Pay Later setup (sink-inventory's BnplCard + activation modal). */
export function BnplCard({ active }: { active: boolean }) {
  const bnpl = useBnplSetup(active)
  const modal = bnpl.modal

  return <>
    <div className="rounded-2xl border border-[#E4EBE7] bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF5E9] text-[#438352]"><Icon name="card" size={19}/></div>
        <div className={cn(bnpl.saving && 'pointer-events-none opacity-50')} aria-busy={bnpl.saving || undefined}><Toggle label="Akawopay — Buy Now, Pay Later" enabled={bnpl.active} onChange={bnpl.toggle}/></div>
      </div>
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span className="text-xs font-extrabold text-[#17382C]">Akawopay — Buy Now, Pay Later</span>
        {bnpl.active && <span className="rounded-full bg-[#E4F2E1] px-2 py-0.5 text-[9px] font-extrabold text-[#3C7F4C]">Active</span>}
      </div>
      <p className="mb-3 text-[11px] leading-5 text-[#7C8D85]">Let customers Buy Now and Pay Later, in-store and online. Akawopay decides who qualifies and collects the repayments — you are settled within 24 hours.</p>

      {bnpl.checking
        ? <Skeleton className="mb-3 h-10 w-full rounded-xl"/>
        : !bnpl.ready && !bnpl.active && <div className="mb-3 flex items-start gap-2 rounded-xl border border-[#F1D9A6] bg-[#FFF8E8] p-2.5">
          <span className="mt-0.5 shrink-0 text-[#A16A15]"><Icon name="shield" size={14}/></span>
          <p className="text-[11px] leading-5 text-[#6B5A35]">Upgrade your KYC verification to Tier {bnpl.minTier} to unlock Buy Now Pay Later for your customers. <button type="button" onClick={bnpl.goToVerification} className="font-extrabold text-[#438352] hover:underline">Verify now</button></p>
        </div>}

      <button type="button" onClick={bnpl.learnMore} className="text-[11px] font-extrabold text-[#438352] hover:underline">Learn more</button>
    </div>

    <Modal open={modal.open} onClose={modal.close} panelClassName="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white">
      <div className="border-b border-[#EDF1EF] p-6 pb-4"><ModalHeader title="Activate BNPL with Akawopay" onClose={modal.close}/></div>
      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        <div className="space-y-2 text-xs leading-5 text-[#60736A]">
          <p>Offer your customers the flexibility to Buy Now and Pay Later, both in-store and online.</p>
          <p>With Sync360, you can connect your business to Akawopay and offer BNPL to eligible customers.</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-start gap-2 rounded-xl bg-[#F4F8F5] p-3"><span className="mt-0.5 text-[#7C8D85]"><Icon name="building" size={14}/></span><p className="text-[11px] leading-5 text-[#4F6359]"><span className="font-extrabold text-[#17382C]">In-store:</span> Customers can choose BNPL when purchasing directly from your business.</p></div>
          <div className="flex items-start gap-2 rounded-xl bg-[#F4F8F5] p-3"><span className="mt-0.5 text-[#7C8D85]"><Icon name="card" size={14}/></span><p className="text-[11px] leading-5 text-[#4F6359]"><span className="font-extrabold text-[#17382C]">Online:</span> Customers can access BNPL when purchasing through your online store.</p></div>
        </div>
        <p className="rounded-xl border border-[#BFD9C3] bg-[#EEF8EC] p-3 text-xs font-extrabold text-[#17382C]">{BNPL_FEE_LABEL}</p>

        {!bnpl.ready
          ? <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-xl border border-[#F1D9A6] bg-[#FFF8E8] p-4">
              <span className="mt-0.5 shrink-0 text-[#A16A15]"><Icon name="shield" size={18}/></span>
              <div><p className="text-xs font-extrabold text-[#17382C]">Verification required</p><p className="mt-1 text-[11px] leading-5 text-[#6B5A35]">{bnpl.reason}</p></div>
            </div>
            <Button onClick={bnpl.goToVerification} className="w-full py-3">Go to verification</Button>
          </div>
          : <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-xl border border-[#BFD9C3] bg-[#EEF8EC] p-3 text-[11px] font-bold text-[#3C7F4C]"><Icon name="check" size={15} stroke={2.4}/>Your account is verified — you can activate BNPL.</div>
            <div>
              <h4 className="mb-2 text-xs font-extrabold text-[#17382C]">BNPL Merchant Terms &amp; Conditions</h4>
              <div className="max-h-56 overflow-y-auto rounded-xl border border-[#E2E9E5] bg-[#F8FAF8] p-3"><BnplTerms/></div>
            </div>
            <label className="flex cursor-pointer items-start gap-2.5">
              <input type="checkbox" checked={modal.agreed} onChange={event => modal.setAgreed(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#529661]"/>
              <span className="text-[11px] leading-5 text-[#4F6359]">I have read and agree to the BNPL Merchant Terms &amp; Conditions.</span>
            </label>
            {modal.apiError && <p role="alert" className="text-[11px] font-extrabold text-[#C2483D]">{modal.apiError}</p>}
          </div>}
      </div>
      {bnpl.ready && <div className="flex gap-2 border-t border-[#EDF1EF] p-4 sm:p-5">
        <Button variant="outline" onClick={modal.close} disabled={bnpl.saving} className="flex-1 py-3">Cancel</Button>
        <Button onClick={modal.activate} disabled={!modal.agreed} loading={bnpl.saving} className="flex-1 py-3">Activate BNPL</Button>
      </div>}
    </Modal>
  </>
}
