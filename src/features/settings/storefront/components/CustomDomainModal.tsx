import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { Modal, ModalFooter, ModalHeader } from '@/components/ui/Modal'
import { cn } from '@/lib/cn'
import { useCustomDomain } from '../hooks/useCustomDomain'

export function CustomDomainModal({ open, onClose, currentDomain }: { open: boolean; onClose: () => void; currentDomain: string }) {
  return <Modal open={open} onClose={onClose} panelClassName="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-[0_25px_80px_rgba(9,38,28,.2)] sm:p-7">
    {/* Keyed so each opening starts fresh at step 1. */}
    {open && <DomainFlow key={currentDomain} currentDomain={currentDomain} onClose={onClose}/>}
  </Modal>
}

function DomainFlow({ currentDomain, onClose }: { currentDomain: string; onClose: () => void }) {
  const flow = useCustomDomain(currentDomain, onClose)

  return <>
    <ModalHeader title="Connect a custom domain" description={flow.step === 1 ? 'Step 1 of 2 · Enter the domain you own' : 'Step 2 of 2 · Point your domain to SyncShip'} onClose={onClose} align="start"/>
    <div className="mt-5 flex gap-2">{[1, 2].map(item => <span key={item} className={cn('h-1.5 flex-1 rounded-full', item <= flow.step ? 'bg-[#529661]' : 'bg-[#E3EAE6]')}/>)}</div>

    {flow.step === 1 ? <form className="mt-6" onSubmit={event => { event.preventDefault(); flow.continueToDns() }}>
      <Field label="Your domain" placeholder="shop.yourbusiness.com" value={flow.input} onValueChange={flow.setInput} error={flow.error} hint="Subdomains like shop. or store. work best." autoFocus/>
      <ModalFooter><Button variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" icon="arrow">Continue</Button></ModalFooter>
    </form> : <div className="mt-6">
      <p className="text-xs leading-5 text-[#60736A]">In your domain provider’s DNS settings, add this record for <strong className="text-[#28483B]">{flow.domain}</strong>:</p>
      <div className="mt-4 overflow-hidden rounded-2xl border border-[#DCE6E0]">
        <div className="grid grid-cols-[70px_1fr] border-b border-[#E7EDE9] bg-[#F8FAF8] px-4 py-2.5 text-[9px] font-extrabold uppercase tracking-[.08em] text-[#8B9992] sm:grid-cols-[80px_100px_1fr]"><span>Type</span><span className="hidden sm:block">Host</span><span>Points to</span></div>
        <div className="grid grid-cols-[70px_1fr] items-center gap-y-1 px-4 py-3 text-xs font-bold text-[#28483B] sm:grid-cols-[80px_100px_1fr]">
          <span>CNAME</span>
          <span className="hidden truncate sm:block">{flow.hostLabel}</span>
          <span className="flex min-w-0 items-center justify-between gap-2"><span className="truncate">{flow.dnsTarget}</span><button type="button" onClick={flow.copyTarget} aria-label="Copy CNAME target" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#438352] hover:bg-[#EAF5E9]"><Icon name={flow.copied ? 'check' : 'copy'} size={15}/></button></span>
        </div>
      </div>
      <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#F1F7F1] p-3 text-[10px] leading-4 text-[#60766A]"><Icon name="clock" size={15}/><span>DNS changes can take up to 48 hours. Your store keeps working on its SyncShip link until the domain is verified. If your provider doesn’t allow a CNAME on the root domain, use a subdomain instead.</span></div>
      <ModalFooter><Button variant="ghost" onClick={flow.back}>Back</Button><Button onClick={flow.submit} loading={flow.saving} icon="check">I’ve added the record</Button></ModalFooter>
    </div>}
  </>
}
