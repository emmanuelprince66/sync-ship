import type { SettingsSection } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Modal, ModalTitle } from '@/components/ui/Modal'
import { ListSkeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { useSetupProgress } from './useSetupProgress'

export function SetupPrompt({ open, onClose, onSelect }: { open: boolean; onClose: () => void; onSelect: (section: SettingsSection) => void }) {
  const { steps, completed, total, percent, isLoading, nextSection } = useSetupProgress()
  return <Modal open={open} onClose={onClose} overlayClassName="bg-[#09261C]/45 p-4 backdrop-blur-[3px]" panelClassName="w-full max-w-2xl overflow-hidden rounded-[28px] bg-white shadow-[0_30px_100px_rgba(9,38,28,.25)]">
    <div className="relative overflow-hidden bg-[#286B43] px-7 py-7 text-white md:px-9">
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border-[40px] border-white/[.06]"/>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute right-5 top-5 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20"><Icon name="close" size={16}/></button>
      <div className="relative">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#286B43]"><Icon name="settings" size={20}/></div>
        <ModalTitle className="mt-4 text-2xl font-black tracking-[-.6px]">Let’s get your business ready</ModalTitle>
        <div className="mt-2 max-w-lg text-xs leading-5 text-white/65">Complete these steps so customers can shop, pay, and receive products without interruptions.</div>
        <div className="mt-5 flex items-center gap-3"><div className="h-2 flex-1 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[#A5D86A]" style={{ width: `${percent}%` }}/></div><span className="text-[10px] font-extrabold text-[#CDEACB]">{completed} of {total} complete</span></div>
      </div>
    </div>
    <div className="p-5 md:p-7">
      {isLoading ? <ListSkeleton rows={4} rowClassName="flex items-center gap-4 rounded-2xl border border-[#E2E9E5] p-4" className="flex flex-col gap-3"/> : <div className="flex flex-col gap-3">{steps.map(step => <button type="button" key={step.title} onClick={() => onSelect(step.section)} className="flex w-full items-center gap-4 rounded-2xl border border-[#E2E9E5] p-4 text-left transition hover:border-[#AACDB2] hover:bg-[#F7FAF7]">
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', step.done ? 'bg-[#E4F2E1] text-[#438352]' : 'bg-[#F0F4F1] text-[#6A7C73]')}><Icon name={step.done ? 'check' : step.icon} size={19}/></div>
        <div className="flex-1"><div className="flex items-center gap-2"><span className="text-xs font-extrabold text-[#28483B]">{step.title}</span>{step.done && <span className="rounded-full bg-[#E4F2E1] px-2 py-0.5 text-[8px] font-extrabold text-[#438352]">Done</span>}</div><div className="mt-1 text-[10px] text-[#829189]">{step.text}</div></div>
        <Icon name="arrow" size={16}/>
      </button>)}</div>}
      <div className="mt-6 flex items-center justify-between"><button type="button" onClick={onClose} className="text-[11px] font-bold text-[#7C8D85]">I’ll finish this later</button><Button onClick={() => onSelect(nextSection)}>Continue setup</Button></div>
    </div>
  </Modal>
}
