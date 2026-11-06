import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'
import { WIZARD_STEPS } from '../../hooks/useCreateShipmentWizard'

export function Stepper({ step }: { step: number }) {
  return <ol className="mb-8 flex items-start justify-center" aria-label="Shipment steps">
    {WIZARD_STEPS.map((label, index) => <li key={label} aria-current={index + 1 === step ? 'step' : undefined} className={cn('relative flex items-start', index < WIZARD_STEPS.length - 1 && 'flex-1')}>
      <div className="relative z-10 flex min-w-[64px] flex-col items-center text-center">
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-full border-2 text-[11px] font-black transition', index + 1 < step ? 'border-[#529661] bg-[#529661] text-white' : index + 1 === step ? 'border-[#09261C] bg-[#09261C] text-white shadow-[0_0_0_5px_rgba(82,150,97,.12)]' : 'border-[#D9E3DD] bg-white text-[#91A098]')}>{index + 1 < step ? <Icon name="check" size={14} stroke={2.5}/> : index + 1}</div>
        <div className={cn('mt-2 hidden text-[10px] font-extrabold sm:block', index + 1 <= step ? 'text-[#26473A]' : 'text-[#9CA9A2]')}>{label}</div>
      </div>
      {index < WIZARD_STEPS.length - 1 && <div className={cn('absolute left-[42px] right-[-22px] top-4 h-[2px]', index + 1 < step ? 'bg-[#529661]' : 'bg-[#E2E9E5]')}/>}
    </li>)}
  </ol>
}
