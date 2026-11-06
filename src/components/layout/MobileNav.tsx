import { NavLink } from 'react-router'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'
import { paths } from '@/routes/paths'
import { navItems } from './nav'

export function MobileNav() {
  return <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-[#DFE7E2] bg-white px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden">
    {navItems.map(item => <NavLink key={item.id} to={item.to} end={item.to === paths.dashboard} className={({ isActive }) => cn('flex flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[10px] font-bold', isActive ? 'text-[#3F8150]' : 'text-[#7D8D85]')}>
      <Icon name={item.icon} size={18}/>{item.shortLabel}
    </NavLink>)}
  </nav>
}
