import type { AccountType } from '@/api/kyc'
import { Icon, type IconName } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'

const types: { id: AccountType; icon: IconName; title: string; text: string; meta: string }[] = [
  { id: 'individual', icon: 'user', title: 'Individual / sole trader', text: 'Verify with your NIN, BVN and home address. Quickest way to start.', meta: 'Up to ₦5,000,000 daily' },
  { id: 'corporate', icon: 'building', title: 'Registered business', text: 'For companies registered with CAC. Needs company documents and director details.', meta: 'Up to ₦5,000,000 daily' },
]

/** Same card pattern as the design's "Who will complete checkout?" step. */
export function AccountTypePicker({ value, onChange }: { value: AccountType | null; onChange: (type: AccountType) => void }) {
  return <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Account type">
    {types.map(item => <button key={item.id} type="button" role="radio" aria-checked={value === item.id} onClick={() => onChange(item.id)} className={cn('relative rounded-2xl border-2 p-5 text-left transition', value === item.id ? 'border-[#529661] bg-[#F3F9F2]' : 'border-[#E0E8E3] hover:border-[#BDD4C3]')}>
      {value === item.id && <span className="absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full bg-[#529661] text-white"><Icon name="check" size={12} stroke={2.5}/></span>}
      <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', value === item.id ? 'bg-[#DDEFD9] text-[#3E7F4D]' : 'bg-[#F0F4F1] text-[#64776D]')}><Icon name={item.icon} size={21}/></div>
      <div className="mt-4 text-sm font-extrabold text-[#17382C]">{item.title}</div>
      <div className="mt-2 text-xs leading-5 text-[#71837A]">{item.text}</div>
      <div className="mt-4 flex items-center gap-1.5 text-[10px] font-extrabold text-[#477952]"><Icon name="shield" size={14}/>{item.meta}</div>
    </button>)}
  </div>
}
