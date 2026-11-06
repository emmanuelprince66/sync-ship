import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Modal, ModalFooter, ModalHeader } from '@/components/ui/Modal'
import { SHIPBUBBLE_TERMS } from '../../constants'

/** Terms shown the first time Shipbubble is switched on. */
export function ShipbubbleAgreementModal({ open, onClose, onAccept, accepting }: { open: boolean; onClose: () => void; onAccept: () => void; accepting: boolean }) {
  return <Modal open={open} onClose={onClose} panelClassName="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-[0_25px_80px_rgba(9,38,28,.2)] sm:p-7">
    <ModalHeader title="Connect Shipbubble" description="Accept the terms to start automating delivery." onClose={onClose}/>
    <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[#09261C] p-5 text-white">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10"><Icon name="truck" size={19}/></div>
      <div><div className="text-sm font-extrabold">50+ delivery partners</div><div className="mt-1 text-[11px] leading-5 text-white/60">Live rates at checkout, instant dispatch and real-time tracking across Nigeria.</div></div>
    </div>
    <div className="mt-5 text-[10px] font-extrabold uppercase tracking-[.08em] text-[#75877E]">By connecting, you agree to</div>
    <ul className="mt-3 space-y-3">{SHIPBUBBLE_TERMS.map(term => <li key={term.title} className="flex gap-3">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E0F0DE] text-[#438352]"><Icon name="check" size={11} stroke={3}/></span>
      <div><div className="text-xs font-extrabold text-[#28483B]">{term.title}</div><div className="mt-0.5 text-[11px] leading-5 text-[#75877E]">{term.body}</div></div>
    </li>)}</ul>
    <ModalFooter>
      <Button variant="ghost" onClick={onClose}>Not now</Button>
      <Button icon="link" loading={accepting} onClick={onAccept}>I agree & connect</Button>
    </ModalFooter>
  </Modal>
}
