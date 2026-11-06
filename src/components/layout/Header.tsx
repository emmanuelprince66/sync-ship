import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'
import { useTopBar } from './hooks'
import { ProfileMenu } from './ProfileMenu'

/** Top bar, modelled on sink-inventory's TopBar: greeting + business, notifications, profile menu. */
export function Header({ title }: { title: string }) {
  const bar = useTopBar()

  return (
    <header className="sticky top-0 z-20 flex h-[74px] items-center justify-between gap-3 border-b border-[#E7EDE9] bg-white/90 px-4 backdrop-blur sm:px-5 md:px-8">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h1 className="truncate text-[19px] font-extrabold text-[#09261C]">
            {bar.isOverview ? <>Welcome back{bar.firstName && <>, <span className="text-[#438352]">{bar.firstName}</span></>}</> : title}
          </h1>
          {bar.verification && <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-extrabold', bar.verification.ok ? 'bg-[#E4F2E1] text-[#3C7F4C]' : 'bg-[#FFF4D9] text-[#A16A15]')}>{bar.verification.text}</span>}
        </div>
        <div className="truncate text-[11px] font-semibold text-[#87968F]">{bar.businessName ? `Managing ${bar.businessName}` : 'Dashboard overview'} · {bar.date}</div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
        <button type="button" aria-label={bar.unread > 0 ? `Notifications (${bar.unread} unread)` : 'Notifications'} className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#E1E9E4] bg-white text-[#53645C] transition-colors hover:bg-[#F3F7F4]">
          <Icon name="bell" size={18}/>
          {bar.unread > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-[#E65A4F] px-1 text-[9px] font-extrabold text-white">{bar.unread > 99 ? '99+' : bar.unread}</span>}
        </button>
        <Button icon="plus" onClick={bar.createShipment} className="hidden sm:flex">Create shipment</Button>
        <Button icon="plus" aria-label="Create shipment" onClick={bar.createShipment} className="h-10 w-10 gap-0 p-0 sm:hidden"/>
        <div className="hidden h-7 w-px bg-[#E4EBE7] sm:block" aria-hidden="true"/>
        <ProfileMenu/>
      </div>
    </header>
  )
}
