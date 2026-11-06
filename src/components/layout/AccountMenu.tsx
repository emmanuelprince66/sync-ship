import { useRef } from 'react'
import { Icon, type IconName } from '@/components/ui/Icon'
import { useDismiss } from '@/hooks/useDismiss'
import { cn } from '@/lib/cn'
import { useSidebar } from './hooks'

type AccountMenuProps = {
  /** "sidebar": full-width row in the green sidebar, menu opens upward. "header": avatar button on phones, menu opens downward. */
  variant: 'sidebar' | 'header'
}

function BusinessAvatar({ logo, initials, className }: { logo: string; initials: string; className: string }) {
  return logo
    ? <img src={logo} alt="" className={cn('shrink-0 object-cover', className)}/>
    : <div className={cn('flex shrink-0 items-center justify-center font-black', className)}>{initials}</div>
}

function MenuItem({ icon, title, detail, tone = 'default', onClick }: { icon: IconName; title: string; detail: string; tone?: 'default' | 'danger'; onClick: () => void }) {
  const danger = tone === 'danger'
  return <button type="button" role="menuitem" onClick={onClick} className={cn('group flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors', danger ? 'hover:bg-[#FFF3F1]' : 'hover:bg-[#F1F7F2]')}>
    <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', danger ? 'bg-[#FFF0EE] text-[#D15B50]' : 'bg-[#EAF5E9] text-[#438352]')}><Icon name={icon} size={17}/></span>
    <span className="min-w-0 flex-1">
      <span className={cn('block text-xs font-extrabold', danger ? 'text-[#C2483D]' : 'text-[#17382C]')}>{title}</span>
      <span className="mt-0.5 block truncate text-[10px] font-semibold text-[#87968F]">{detail}</span>
    </span>
    {!danger && <span className="text-[#A3B1AA] transition-transform group-hover:translate-x-0.5"><Icon name="arrow" size={15}/></span>}
  </button>
}

/** Business account block + menu (switch business, log out). Shared by the sidebar and the phone header. */
export function AccountMenu({ variant }: AccountMenuProps) {
  const { businessName, businessLogo, accountInitials, menuOpen, toggleMenu, closeMenu, switchBusiness, signOut } = useSidebar()
  const rootRef = useRef<HTMLDivElement>(null)
  useDismiss(rootRef, menuOpen, closeMenu)
  const sidebar = variant === 'sidebar'

  return <div ref={rootRef} className={cn('relative', sidebar ? 'mt-4' : 'lg:hidden')}>
    {sidebar
      ? <button type="button" aria-haspopup="menu" aria-expanded={menuOpen} onClick={toggleMenu} className={cn('flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-white transition-colors', menuOpen ? 'bg-white/15' : 'hover:bg-white/10')}>
        <BusinessAvatar logo={businessLogo} initials={accountInitials} className="h-9 w-9 rounded-full bg-white text-xs text-[#25603B]"/>
        <span className="min-w-0 flex-1"><span className="block truncate text-xs font-extrabold">{businessName}</span><span className="block truncate text-[10px] text-white/55">Business account</span></span>
        <span className={cn('text-white/70 transition-transform', menuOpen && 'rotate-180')}><Icon name="chevron" size={18}/></span>
      </button>
      : <button type="button" aria-label="Account menu" aria-haspopup="menu" aria-expanded={menuOpen} onClick={toggleMenu} className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-[#E1E9E4] bg-[#EAF5E9] text-[11px] font-black text-[#286B43]">
        {businessLogo ? <img src={businessLogo} alt="" className="h-full w-full object-cover"/> : accountInitials}
      </button>}

    {menuOpen && <div role="menu" className={cn('absolute z-40 rounded-2xl border border-[#E2EAE5] bg-white p-2 text-[#09261C] shadow-[0_20px_50px_rgba(9,38,28,.22)]', sidebar ? 'bottom-full left-0 right-0 mb-2' : 'right-0 top-12 w-72')}>
      <div className="flex items-center gap-3 rounded-xl bg-[#F4F8F5] px-2.5 py-2.5">
        <BusinessAvatar logo={businessLogo} initials={accountInitials} className="h-9 w-9 rounded-lg bg-[#286B43] text-[11px] text-white"/>
        <div className="min-w-0"><div className="truncate text-xs font-extrabold text-[#17382C]">{businessName}</div><div className="mt-0.5 text-[10px] font-semibold text-[#87968F]">Current business</div></div>
      </div>
      <div className="mt-1.5 space-y-0.5">
        <MenuItem icon="building" title="Switch business" detail="Open a different business" onClick={switchBusiness}/>
        <div className="mx-2.5 my-1 border-t border-[#EDF1EF]"/>
        <MenuItem icon="logout" title="Log out" detail="Sign out of your account" tone="danger" onClick={signOut}/>
      </div>
    </div>}
  </div>
}
