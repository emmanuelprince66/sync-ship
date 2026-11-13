import { useRef } from 'react'
import { Icon, type IconName } from '@/components/ui/Icon'
import { useDismiss } from '@/hooks/useDismiss'
import { cn } from '@/lib/cn'
import { useTopBar } from './hooks'

function Avatar({ initials, className }: { initials: string; className: string }) {
  return <span className={cn('flex shrink-0 items-center justify-center rounded-full bg-[#286B43] font-black text-white', className)}>{initials}</span>
}

function Item({ icon, label, onClick, badge, tone = 'default' }: { icon: IconName; label: string; onClick: () => void; badge?: { text: string; ok: boolean }; tone?: 'default' | 'danger' }) {
  const danger = tone === 'danger'
  return <button type="button" role="menuitem" onClick={onClick} className={cn('flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-bold transition-colors', danger ? 'text-[#C2483D] hover:bg-[#FFF3F1]' : 'text-[#34483F] hover:bg-[#F1F7F2]')}>
    <span className={danger ? 'text-[#D15B50]' : 'text-[#7C8D85]'}><Icon name={icon} size={16}/></span>
    <span className="flex-1">{label}</span>
    {badge && <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-extrabold', badge.ok ? 'bg-[#E4F2E1] text-[#3C7F4C]' : 'bg-[#FFF4D9] text-[#A16A15]')}>{badge.text}</span>}
  </button>
}

/** Profile dropdown in the top bar (same contents as sink-inventory's TopBar). */
export function ProfileMenu() {
  const bar = useTopBar()
  const rootRef = useRef<HTMLDivElement>(null)
  useDismiss(rootRef, bar.menuOpen, bar.closeMenu)

  return <div ref={rootRef} className="relative">
    <button type="button" aria-haspopup="menu" aria-expanded={bar.menuOpen} onClick={bar.toggleMenu} className={cn('flex h-10 items-center gap-2 rounded-xl px-1.5 transition-colors md:pr-2.5', bar.menuOpen ? 'bg-[#EEF5F0]' : 'hover:bg-[#F3F7F4]')}>
      <Avatar initials={bar.initials} className="h-8 w-8 text-[11px]"/>
      <span className="hidden flex-col items-start md:flex">
        <span className="max-w-[120px] truncate text-xs font-extrabold text-[#17382C]">{bar.firstName || 'User'}</span>
        <span className="text-[10px] font-semibold capitalize text-[#87968F]">{bar.roleLabel}</span>
      </span>
      <span className={cn('hidden text-[#9AA8A1] transition-transform md:block', bar.menuOpen && 'rotate-180')}><Icon name="chevron" size={16}/></span>
    </button>

    {bar.menuOpen && <div role="menu" className="absolute right-0 top-12 z-40 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-[#E2EAE5] bg-white p-1.5 shadow-[0_20px_50px_rgba(9,38,28,.18)]">
      <div className="flex items-center gap-3 rounded-xl bg-[#F4F8F5] px-3 py-3">
        <Avatar initials={bar.initials} className="h-10 w-10 text-xs"/>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-extrabold text-[#17382C]">{bar.fullName || 'User'}</div>
          <div className="mt-0.5 truncate text-[10px] font-semibold text-[#87968F]">{bar.email}</div>
          <span className="mt-1.5 inline-block rounded-full bg-white px-2 py-0.5 text-[9px] font-extrabold capitalize text-[#4D7656]">{bar.roleLabel}</span>
        </div>
      </div>
      <div className="mt-1 space-y-0.5 py-1">
        {bar.canManageSetup && <Item icon="building" label="Business settings" onClick={bar.goToBusinessSettings}/>}
        {bar.canManageSetup && <Item icon="shield" label="KYC verification" onClick={bar.goToKyc} badge={bar.kycBadge}/>}
        <Item icon="route" label="Switch business" onClick={bar.switchBusiness}/>
        <Item icon="help" label="Help & support" onClick={bar.openHelp}/>
      </div>
      <div className="mx-2 border-t border-[#EDF1EF]"/>
      <div className="py-1"><Item icon="logout" label="Sign out" tone="danger" onClick={bar.signOut}/></div>
    </div>}
  </div>
}
