import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Modal, ModalFooter, ModalHeader } from '@/components/ui/Modal'

export function CustomDomainUpgradeModal({ open, onClose, onUpgrade }: { open: boolean; onClose: () => void; onUpgrade: () => void }) {
  return <Modal open={open} onClose={onClose} panelClassName="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-[0_25px_80px_rgba(9,38,28,.2)] sm:p-7">
    <ModalHeader title="Get your own domain" description="Your business deserves a .com or .ng customers can trust and remember." onClose={onClose} align="start"/>
    <div className="mt-5 rounded-2xl bg-[#F3F7F4] p-4">
      <div className="text-[9px] font-extrabold uppercase tracking-[.1em] text-[#829189]">Your store address</div>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-bold text-[#5F7268]">
        <span className="break-all">store.sync360.africa/yourbusiness</span>
        <Icon name="arrow" size={14}/>
        <span className="break-all text-[#286B43]">yourbusiness.com</span>
      </div>
    </div>
    <div className="mt-5 text-xs font-extrabold text-[#28483B]">Why upgrade?</div>
    <ul className="mt-3 space-y-3">
      {[
        ['Professional', 'Customers trust a store with your own domain.'],
        ['Easy to remember', 'Customers can find your store faster.'],
        ['Your brand', 'Make your storefront address yours.'],
      ].map(([title, description]) => <li key={title} className="flex items-start gap-2.5 text-[11px] leading-5 text-[#6C7E75]">
        <span className="mt-0.5 shrink-0 text-[#529661]"><Icon name="check" size={15}/></span>
        <span><strong className="text-[#405B50]">{title}</strong> — {description}</span>
      </li>)}
    </ul>
    <ModalFooter className="mt-6 grid grid-cols-2 gap-2">
      <Button variant="ghost" onClick={onClose} className="w-full justify-center">Maybe later</Button>
      <Button onClick={onUpgrade} icon="arrow" className="w-full justify-center">Upgrade</Button>
    </ModalFooter>
  </Modal>
}
