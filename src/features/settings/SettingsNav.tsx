import type { SettingsSection } from '@/api/types'
import { PageHeader } from '@/components/ui/common'
import { Icon, type IconName } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'

const tabs: { name: SettingsSection; icon: IconName; description: string }[] = [
  { name: 'Storefront', icon: 'building', description: 'Store identity and channels' },
  { name: 'Shipping setup', icon: 'truck', description: 'Pickup and package defaults' },
  { name: 'Payments & KYC', icon: 'wallet', description: 'Payments, wallet and verification' },
  { name: 'Team & users', icon: 'user', description: 'Employee accounts and roles' },
  { name: 'Communications', icon: 'bell', description: 'Customer and order updates' },
]

export function SettingsNav({ active, onSelect }: { active: SettingsSection; onSelect: (section: SettingsSection) => void }) {
  return <div className="min-w-0">
    <PageHeader className="mb-6" title="Settings" subtitle="Configure how your business operates."/>
    {/* Phones/tablets: one scrollable row of tabs. Desktop: the design's vertical list. */}
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:block lg:space-y-1 lg:overflow-visible lg:px-0 lg:pb-0">{tabs.map(item => <button type="button" key={item.name} aria-current={active === item.name ? 'page' : undefined} onClick={() => onSelect(item.name)} className={cn('flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-left transition lg:w-full lg:gap-3 lg:py-3', active === item.name ? 'bg-[#EAF5E9] text-[#367546]' : 'border border-[#E2E9E5] bg-white text-[#718279] hover:bg-white lg:border-0 lg:bg-transparent')}>
      <Icon name={item.icon} size={18}/>
      <div><div className="whitespace-nowrap text-xs font-extrabold">{item.name}</div><div className={cn('mt-0.5 hidden text-[9px] lg:block', active === item.name ? 'text-[#5E8867]' : 'text-[#9AA7A0]')}>{item.description}</div></div>
    </button>)}</div>
  </div>
}
