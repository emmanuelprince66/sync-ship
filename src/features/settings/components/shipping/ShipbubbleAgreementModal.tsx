import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Icon, type IconName } from '@/components/ui/Icon'
import { Modal, ModalTitle } from '@/components/ui/Modal'
import { cn } from '@/lib/cn'

/** sink-inventory's ShipbubbleAgreementModal terms. */
const TERMS: { icon: IconName; title: string; body: string }[] = [
  { icon: 'truck', title: 'Pickup at your store', body: 'Shipbubble riders will collect parcels from the pickup address you configure. Make sure someone is available during your business hours.' },
  { icon: 'wallet', title: 'Delivery charges', body: 'Shipping fees are calculated at checkout and paid by the customer. You can also subsidise them yourself from the General Settings page.' },
  { icon: 'shield', title: 'Liability & insurance', body: 'Items are insured for declared value during transit. Fragile or restricted items must be flagged when packaging.' },
  { icon: 'link', title: 'Data sharing', body: 'We share the order destination and package details with Shipbubble so they can quote and dispatch your shipments.' },
]

/** Checkbox state; resets on every open because the body remounts with the dialog. */
const useConsent = () => {
  const [agreed, setAgreed] = useState(false)
  return { agreed, setAgreed }
}

function AgreementBody({ onClose, onConnect, loading }: { onClose: () => void; onConnect: () => void; loading?: boolean }) {
  const { agreed, setAgreed } = useConsent()
  return <>
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#09261C] text-white"><Icon name="truck" size={18}/></span>
        <div><ModalTitle className="text-lg font-black text-[#17382C]">Connect Shipbubble</ModalTitle><div className="mt-1 text-xs leading-5 text-[#819088]">Accept the terms below to start automating your shipping with Shipbubble.</div></div>
      </div>
      <button type="button" aria-label="Close" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#E0E8E3]"><Icon name="close" size={17}/></button>
    </div>

    <div className="mt-5 rounded-2xl border border-[#DDE8E0] bg-[#F4F8F5] p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#426AB2]"><Icon name="truck" size={20}/></span>
        <div className="min-w-0"><div className="text-sm font-extrabold text-[#17382C]">Shipbubble</div><div className="mt-0.5 text-[11px] leading-5 text-[#60736A]">Connects your store to 50+ delivery partners across Nigeria and Africa. Live rates at checkout, instant dispatch, real-time tracking.</div></div>
      </div>
    </div>

    <div className="mt-5 text-[10px] font-extrabold uppercase tracking-[.08em] text-[#75877E]">By connecting, you agree to:</div>
    <div className="mt-2.5 space-y-2.5">{TERMS.map(term => <div key={term.title} className="flex items-start gap-3 rounded-xl border border-[#E8EEEA] bg-[#FAFCFA] p-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#438352]"><Icon name={term.icon} size={15}/></span>
      <div className="min-w-0"><div className="text-xs font-extrabold text-[#17382C]">{term.title}</div><div className="mt-0.5 text-[11px] leading-5 text-[#60736A]">{term.body}</div></div>
    </div>)}</div>

    <label className={cn('mt-4 flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 transition-colors', agreed ? 'border-[#529661] bg-[#F3F9F2]' : 'border-[#E0E8E3] hover:border-[#BDD4C3]')}>
      <input type="checkbox" checked={agreed} onChange={event => setAgreed(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#529661]"/>
      <span className="text-xs leading-5 text-[#34483F]">I have read and agree to the Shipbubble <span className="font-extrabold underline">terms of service</span> and <span className="font-extrabold underline">privacy policy</span>. I’m authorised to bind my business to this agreement.</span>
    </label>

    <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
      <a href="https://shipbubble.com/terms" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-1 text-[11px] font-bold text-[#7C8D85] hover:text-[#34483F] sm:justify-start">Read full terms <Icon name="arrow" size={13}/></a>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1 sm:flex-none">Cancel</Button>
        <Button icon="check" onClick={onConnect} disabled={!agreed} loading={loading} className="flex-1 sm:flex-none">{loading ? 'Connecting...' : 'I agree & Connect'}</Button>
      </div>
    </div>
  </>
}

/** Terms shown the first time Shipbubble is switched on. */
export function ShipbubbleAgreementModal({ open, onClose, onConnect, loading }: { open: boolean; onClose: () => void; onConnect: () => void; loading?: boolean }) {
  return <Modal open={open} onClose={onClose} panelClassName="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-[0_25px_80px_rgba(9,38,28,.2)] sm:p-7">
    <AgreementBody onClose={onClose} onConnect={onConnect} loading={loading}/>
  </Modal>
}
