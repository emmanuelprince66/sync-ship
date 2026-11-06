import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'
import type { KycFlow } from '../../hooks/useKycFlow'

/** Tier ladder: what each level needs and the daily limit it unlocks. */
export function TierRail({ tiers }: { tiers: KycFlow['tiers'] }) {
  return <ol className={cn('grid gap-2', tiers.length === 3 ? 'grid-cols-3' : 'grid-cols-2')}>
    {tiers.map(tier => <li key={tier.tier} aria-current={tier.state === 'current' ? 'step' : undefined} className={cn('min-w-0 rounded-2xl border p-2.5 transition sm:p-3.5', tier.state === 'current' ? 'border-[#529661] bg-[#F3F9F2]' : tier.state === 'done' ? 'border-[#D5E8D3] bg-white' : 'border-[#E4EBE7] bg-[#FAFCFA]')}>
      <div className="flex items-center gap-2">
        <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black', tier.state === 'done' ? 'bg-[#529661] text-white' : tier.state === 'current' ? 'bg-[#09261C] text-white' : 'border-2 border-[#D9E3DD] text-[#91A098]')}>
          {tier.state === 'done' ? <Icon name="check" size={12} stroke={3}/> : tier.tier}
        </span>
        <span className={cn('text-[11px] font-extrabold', tier.state === 'locked' ? 'text-[#91A098]' : 'text-[#17382C]')}>Tier {tier.tier}</span>
        <span className={cn('ml-auto hidden rounded-full px-2 py-0.5 text-[9px] font-extrabold sm:inline', tier.state === 'done' ? 'bg-[#E4F2E1] text-[#438352]' : 'bg-[#F0F4F1] text-[#6A7C73]')}>{tier.limit}/day</span>
      </div>
      <div className="mt-2 truncate text-[10px] font-extrabold text-[#438352] sm:hidden">{tier.limit}/day</div>
      <div className="mt-2 hidden text-[11px] font-bold text-[#34483F] sm:block">{tier.title}</div>
      <div className="mt-0.5 hidden text-[10px] text-[#829189] sm:block">{tier.requirement}</div>
    </li>)}
  </ol>
}
