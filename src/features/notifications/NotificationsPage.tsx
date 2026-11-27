import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/common'
import { Icon, type IconName } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'
import { NOTIFICATION_FILTERS, useNotificationsPage } from './hooks/useNotificationsPage'

/** Icon and tint per notification type (sink's notification-card); anything new falls back to the bell. */
const TYPE_STYLES: Record<string, { icon: IconName; tone: string }> = {
  ORDER: { icon: 'box', tone: 'bg-[#EAF5E9] text-[#438352]' },
  SHIPMENT: { icon: 'truck', tone: 'bg-[#EAF5E9] text-[#438352]' },
  DELIVERY: { icon: 'truck', tone: 'bg-[#EAF5E9] text-[#438352]' },
  WALLET: { icon: 'wallet', tone: 'bg-[#FFF4D9] text-[#A16A15]' },
  PAYMENT: { icon: 'wallet', tone: 'bg-[#FFF4D9] text-[#A16A15]' },
  TRANSACTION: { icon: 'wallet', tone: 'bg-[#FFF4D9] text-[#A16A15]' },
  REFERRAL: { icon: 'users', tone: 'bg-[#E8F2FF] text-[#1367D8]' },
  LOYALTY: { icon: 'card', tone: 'bg-[#F1EBFF] text-[#6D3FD0]' },
}
const styleFor = (type: string) => TYPE_STYLES[type] ?? { icon: 'bell' as IconName, tone: 'bg-[#F1F4F2] text-[#53645C]' }

/** sink's Notifications screen, reached from the top-bar bell. */
export default function NotificationsPage() {
  const page = useNotificationsPage()

  return <div>
    <PageHeader
      title="Notifications"
      subtitle="Orders, shipments, wallet and other activity across your business."
      actions={page.unread > 0 && <Button variant="outline" icon="check" loading={page.markingAll} onClick={page.markAllRead} className="w-full sm:w-auto">Mark all read</Button>}
    />

    <div className="mb-5 flex flex-wrap items-center gap-2" role="tablist" aria-label="Show">
      {NOTIFICATION_FILTERS.map(option => {
        const active = page.filter === option
        return <button key={option} type="button" role="tab" aria-selected={active} onClick={() => page.setFilter(option)} className={cn('flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-bold transition-colors', active ? 'bg-[#09261C] text-white' : 'border border-[#E1E9E4] bg-white text-[#53645C] hover:text-[#09261C]')}>
          {option}
          <span className={cn('rounded-full px-1.5 text-[10px]', active ? 'bg-white/20 text-white' : 'bg-[#F1F4F2] text-[#53645C]')}>{page.counts[option]}</span>
        </button>
      })}
    </div>

    {page.isLoading
      ? <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading notifications">{Array.from({ length: 5 }, (_, index) => <div key={index} className="h-[82px] animate-pulse rounded-2xl bg-[#EEF2EF]"/>)}</div>
      : page.isError
        ? <div className="rounded-2xl border border-[#E2EAE5] bg-white px-4 py-12 text-center">
          <p className="text-sm font-bold text-[#09261C]">We couldn’t load your notifications</p>
          <p className="mt-1 text-xs text-[#7C8D85]">Check your connection and try again.</p>
          <Button variant="outline" onClick={page.retry} className="mt-4">Try again</Button>
        </div>
        : page.rows.length > 0
          ? <div className="flex flex-col gap-3">
            {page.rows.map(row => {
              const style = styleFor(row.type)
              const pending = page.markingId === row.id
              const clickable = !row.isRead && Boolean(row.id) && !pending
              return <div
                key={row.id || `${row.createdAt}-${row.message}`}
                role={clickable ? 'button' : undefined}
                tabIndex={clickable ? 0 : undefined}
                onClick={clickable ? () => page.markRead(row.id) : undefined}
                onKeyDown={clickable ? event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); page.markRead(row.id) } } : undefined}
                className={cn('flex w-full min-w-0 items-start gap-3 rounded-2xl border border-[#E2EAE5] bg-white p-4 transition-colors', !row.isRead && 'border-l-4 border-l-[#438352]', clickable && 'cursor-pointer hover:border-[#438352]')}
              >
                <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', style.tone)}><Icon name={style.icon} size={16}/></span>
                <div className="min-w-0 flex-1">
                  <p className={cn('text-sm leading-relaxed [overflow-wrap:anywhere]', row.isRead ? 'text-[#53645C]' : 'font-bold text-[#09261C]')}>{row.message || 'Notification'}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    {row.type && <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', style.tone)}>{row.type.charAt(0) + row.type.slice(1).toLowerCase()}</span>}
                    {row.createdAt && <span className="text-[11px] text-[#87968F]">{row.when}</span>}
                  </div>
                </div>
                {!row.isRead && <span className="mt-1 shrink-0 whitespace-nowrap text-[10px] font-bold text-[#438352]">{pending ? 'Marking…' : 'Mark read'}</span>}
              </div>
            })}
          </div>
          : <div className="rounded-2xl border border-dashed border-[#DCE5DF] bg-white px-4 py-14 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#EAF5E9] text-[#438352]"><Icon name="check" size={26}/></div>
            <p className="text-sm font-bold text-[#09261C]">{page.filter === 'Unread' ? 'Nothing unread' : 'All caught up'}</p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-[#7C8D85]">{page.filter === 'Unread' ? 'Every notification here has been read.' : 'New orders, shipments and wallet activity will appear here as they happen.'}</p>
          </div>}
  </div>
}
