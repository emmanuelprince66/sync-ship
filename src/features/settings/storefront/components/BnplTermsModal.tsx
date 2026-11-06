import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Modal, ModalFooter, ModalHeader } from '@/components/ui/Modal'

const points = [
  'Eligible customers can choose BNPL when buying in-store or from your online store.',
  'You receive the full order amount; Akawopay collects the instalments from the customer.',
  'Akawopay decides customer eligibility. Declined customers can still pay in full.',
  'You can turn BNPL off at any time. Existing instalment plans continue as agreed.',
]

export function BnplTermsModal({ open, onClose, agreed, onAgreedChange, onActivate, activating }: {
  open: boolean
  onClose: () => void
  agreed: boolean
  onAgreedChange: (agreed: boolean) => void
  onActivate: () => void
  activating: boolean
}) {
  return <Modal open={open} onClose={onClose} panelClassName="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-[0_25px_80px_rgba(9,38,28,.2)] sm:p-7">
    <ModalHeader title="Activate BNPL with Akawopay" description="Review the merchant terms before offering buy now, pay later." onClose={onClose} align="start"/>
    <ul className="mt-6 space-y-3">
      {points.map(point => <li key={point} className="flex items-start gap-2.5 text-[11px] leading-5 text-[#52695D]"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E0F0DE] text-[#438352]"><Icon name="check" size={11} stroke={3}/></span>{point}</li>)}
    </ul>
    <div className="mt-5 flex items-start gap-2 rounded-xl bg-[#FFF8E8] p-3 text-[10px] leading-4 text-[#80662B]"><Icon name="shield" size={15}/><span>BNPL needs an activated Sync360 wallet and upgraded KYC. If your account isn’t eligible yet, we’ll tell you what’s missing.</span></div>
    <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-[#E2E9E5] p-3">
      <input type="checkbox" checked={agreed} onChange={event => onAgreedChange(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#529661]"/>
      <span className="text-[11px] font-semibold leading-5 text-[#34483F]">I have read and agree to the BNPL Merchant Terms & Conditions.</span>
    </label>
    <ModalFooter><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={onActivate} disabled={!agreed} loading={activating}>Activate BNPL</Button></ModalFooter>
  </Modal>
}
