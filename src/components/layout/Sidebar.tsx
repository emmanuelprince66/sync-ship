import type { CSSProperties } from 'react'
import { NavLink } from 'react-router'
import { Icon } from '@/components/ui/Icon'
import { Logo } from '@/components/ui/Logo'
import { cn } from '@/lib/cn'
import { paths } from '@/routes/paths'
import { AccountMenu } from './AccountMenu'
import { useSidebar } from './hooks'
import { navItems } from './nav'

/**
 * Active links get no colour transition: animating out of the hover state could leave the
 * background stuck transparent while the text was already green, so the link vanished.
 */
const itemClass = (active: boolean) => cn('flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold [&_svg]:shrink-0', active ? 'bg-[#FFFFFF] text-[#286B43] shadow-sm' : 'text-white/70 transition-colors hover:bg-white/10 hover:text-white')

/** Inline so no stylesheet (cached CSS, extensions) can override the active colours. */
const activeStyle = ({ isActive }: { isActive: boolean }): CSSProperties | undefined =>
  isActive ? { backgroundColor: '#FFFFFF', color: '#286B43' } : undefined

export function Sidebar() {
  const { activeShipments } = useSidebar()

  return <aside className="fixed inset-y-0 left-0 z-30 hidden w-[244px] flex-col bg-[#286B43] px-4 py-6 text-white lg:flex">
    <div className="px-3"><Logo inverse/></div>
    <nav className="mt-10 space-y-1" aria-label="Main">
      {navItems.map(item => <NavLink key={item.id} to={item.to} end={item.to === paths.dashboard} className={({ isActive }) => itemClass(isActive)} style={activeStyle}>
        {({ isActive }) => <>
          <Icon name={item.icon} size={19} stroke={isActive ? 2.2 : 1.8}/><span className="whitespace-nowrap">{item.label}</span>
          {item.id === 'shipments' && activeShipments > 0 && <span className={cn('ml-auto rounded-full px-2 py-0.5 text-[10px] font-extrabold', isActive ? 'bg-[#DCF2D8] text-[#357345]' : 'bg-white/15 text-white')}>{activeShipments}</span>}
        </>}
      </NavLink>)}
    </nav>
    <div className="my-5 border-t border-white/15"/>
    <NavLink to={paths.settings} className={({ isActive }) => itemClass(isActive)} style={activeStyle}>
      <Icon name="settings" size={19}/>Settings
    </NavLink>
    <a href="mailto:support@syncship.africa" className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold text-white/70 hover:bg-white/10 hover:text-white"><Icon name="help" size={19}/>Help & support</a>
    <div className="mt-auto rounded-2xl bg-[#09261C]/35 p-4 text-white">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white/10"><Icon name="truck" size={19}/></div>
      <div className="text-sm font-extrabold">Trusted delivery partners</div>
      <div className="mt-1 text-[11px] leading-4 text-white/60">One dashboard. The best rate for every delivery.</div>
    </div>
    <AccountMenu variant="sidebar"/>
  </aside>
}
