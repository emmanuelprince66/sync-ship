import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { Icon, type IconName } from '@/components/ui/Icon'
import { Modal, ModalFooter, ModalTitle } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { useAutomatedShipping } from '../../hooks/useAutomatedShipping'
import { ShipbubbleAgreementModal } from './ShipbubbleAgreementModal'
import { ShipbubbleSettingsModal } from './ShipbubbleSettingsModal'

function StepTile({ step, icon, title, description, children }: { step: number; icon: IconName; title: string; description: string; children: ReactNode }) {
  return <div className="rounded-2xl border border-[#E2E9E5] bg-white p-4 sm:p-5">
    <div className="flex items-start gap-3 sm:gap-4">
      <div className="flex shrink-0 flex-col items-center pt-0.5 leading-none">
        <span className="text-[9px] font-extrabold uppercase tracking-[.08em] text-[#87968F]">Step</span>
        <span className="text-xl font-black text-[#17382C]">{String(step).padStart(2, '0')}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2"><span className="mt-0.5 text-[#438352]"><Icon name={icon} size={16}/></span><div><div className="text-sm font-extrabold text-[#17382C]">{title}</div><div className="mt-1 text-[11px] leading-5 text-[#7E8E86]">{description}</div></div></div>
        {children}
      </div>
    </div>
  </div>
}

type PartnerCardProps = {
  name: string
  tagline: string
  icon: IconName
  tone: string
  active?: boolean
  configured?: boolean
  busy?: boolean
  comingSoon?: boolean
  onToggle?: (next: boolean) => void
  onConfigure?: () => void
  onHelp?: () => void
}

function PartnerCard({ name, tagline, icon, tone, active = false, configured = false, busy, comingSoon, onToggle, onConfigure, onHelp }: PartnerCardProps) {
  return <div className={cn('relative rounded-2xl border p-4 transition-colors', comingSoon ? 'border-[#E4EBE7] bg-[#F7F9F7]' : active ? 'border-[#9CC9A3] bg-white' : 'border-[#E2E9E5] bg-white hover:border-[#C4D7C9]')}>
    {comingSoon && <span className="absolute right-3 top-3 rounded-full border border-[#E2E9E5] bg-white px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[.06em] text-[#87968F]">Coming soon</span>}
    <div className={cn('mb-3 flex items-start justify-between', comingSoon && 'opacity-50')}>
      <span className={cn('flex h-11 w-11 items-center justify-center rounded-xl', comingSoon ? 'bg-[#E8EEEA] text-[#9AA8A1]' : tone)}><Icon name={icon} size={20}/></span>
      {!comingSoon && <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[.06em]', active ? 'bg-[#E4F2E1] text-[#3C7F4C]' : 'bg-[#F0F4F1] text-[#6A7C73]')}>{active ? 'Active' : 'Inactive'}</span>}
    </div>
    <div className={cn('flex items-center gap-1.5 text-sm font-extrabold', comingSoon ? 'text-[#87968F]' : 'text-[#17382C]')}>
      {name}
      {onConfigure && configured && <span className="rounded border border-[#CFE4CD] bg-[#F1F8EF] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-[.06em] text-[#3C7F4C]">Connected</span>}
    </div>
    <div className={cn('mt-1 text-[11px] leading-5', comingSoon ? 'text-[#A3B1AA]' : 'text-[#7E8E86]')}>{tagline}</div>
    {!comingSoon && <div className="mt-4">
      {/* One filled button: configuring is what a merchant actually needs; the rest is a quiet text row. */}
      {onConfigure && <Button icon="settings" onClick={onConfigure} className="w-full py-2 text-[13px]">{configured ? 'Configure' : 'Set up'}</Button>}
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <button type="button" onClick={() => onToggle?.(!active)} disabled={busy} className={cn('text-[11px] font-extrabold transition-colors disabled:cursor-not-allowed disabled:opacity-40', active ? 'text-[#C2483D] hover:text-[#9F3A31]' : 'text-[#438352] hover:text-[#2F6A3C]')}>{active ? 'Deactivate' : 'Activate'}</button>
        <button type="button" onClick={onHelp} className="text-[11px] font-extrabold text-[#87968F] hover:text-[#34483F]">Get help</button>
      </div>
    </div>}
  </div>
}

/** Settings › Shipping setup — sink-inventory's AutomatedShipping (Logistics Integrations). */
export function AutomatedShipping() {
  const shipping = useAutomatedShipping()

  return <div className="space-y-4">
    <div className="flex items-start gap-2.5 rounded-xl border border-[#CFE4CD] bg-[#F1F8EF] px-4 py-3">
      <span className="mt-0.5 shrink-0 text-[#438352]"><Icon name="help" size={16}/></span>
      <p className="text-xs leading-5 text-[#214A31]">You can still keep manual shipping methods as a fallback.</p>
    </div>

    <StepTile step={1} icon="truck" title="Logistics Integrations" description="Connect a partner network so customers see live shipping rates at checkout.">
      {shipping.isLoading
        ? <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2"><Skeleton className="h-[188px] rounded-2xl"/><Skeleton className="h-[188px] rounded-2xl"/></div>
        : <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <PartnerCard name="Shipbubble" tagline="Nationwide & international delivery with 50+ partners" icon="truck" tone="bg-[#E8F0FC] text-[#426AB2]" active={shipping.isActive} configured={shipping.isConfigured} busy={shipping.saving} onToggle={shipping.toggle} onConfigure={shipping.settingsModal.open} onHelp={shipping.openHelp}/>
          <PartnerCard name="Chowdeck" tagline="Fast, reliable same-day deliveries in select cities" icon="box" tone="bg-[#FFF4D9] text-[#A16A15]" comingSoon/>
        </div>}
    </StepTile>

    <ShipbubbleSettingsModal open={shipping.settingsModal.isOpen} onClose={shipping.settingsModal.close} saved={shipping.saved}/>
    <ShipbubbleAgreementModal open={shipping.agreement.isOpen} onClose={shipping.agreement.close} onConnect={shipping.agreement.accept} loading={shipping.saving}/>

    <Modal open={shipping.deactivate.isOpen} onClose={shipping.deactivate.close} panelClassName="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF0EE] text-[#D15B50]"><Icon name="truck" size={20}/></span>
      <ModalTitle className="mt-4 text-lg font-black text-[#17382C]">Deactivate Shipbubble?</ModalTitle>
      <div className="mt-1.5 text-xs leading-5 text-[#7C8D85]">Customers will stop seeing live Shipbubble rates at checkout. Your saved pickup address and settings are kept, so you can turn it back on anytime.</div>
      <p className="mt-3 text-xs text-[#60736A]">You can reconnect Shipbubble at any time from this same screen.</p>
      <ModalFooter className="flex-col-reverse sm:flex-row">
        <Button variant="outline" onClick={shipping.deactivate.close} disabled={shipping.saving} className="flex-1">Cancel</Button>
        <Button onClick={shipping.deactivate.confirm} loading={shipping.saving} className="flex-1 bg-[#C9483D] shadow-none hover:bg-[#B23D33]">{shipping.saving ? 'Deactivating...' : 'Yes, Deactivate'}</Button>
      </ModalFooter>
    </Modal>
  </div>
}
