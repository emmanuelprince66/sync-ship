import { cn } from '@/lib/cn'
import { Icon } from './Icon'

export function Logo({ inverse = false }: { inverse?: boolean }) {
  return <div className="flex items-center gap-3">
    <div className={cn('relative flex h-10 w-10 items-center justify-center rounded-xl', inverse ? 'bg-white text-[#27613D]' : 'bg-[#09261C] text-white')}>
      <Icon name="route" size={22}/>
      <span className={cn('absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 bg-[#7FCF26]', inverse ? 'border-[#34734A]' : 'border-white')}/>
    </div>
    <div className={cn('text-[20px] font-black tracking-[-0.7px]', inverse ? 'text-white' : 'text-[#09261C]')}>Sync<span className={inverse ? 'text-[#BDE9B8]' : 'text-[#529661]'}>Ship</span></div>
  </div>
}
