import type { ReactNode } from 'react'
import { Icon, type IconName } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'
import { initials } from '@/lib/format'

const statusTones: Record<string, string> = {
  'Active': 'bg-[#E8F5E8] text-[#3C7F4C]',
  'New': 'bg-[#E8F0FC] text-[#426AB2]',
  'At Risk': 'bg-[#FFF4D9] text-[#A16A15]',
  'Inactive': 'bg-[#EFF3F0] text-[#6E7F77]',
  'Completed': 'bg-[#E8F5E8] text-[#3C7F4C]',
  'Pending': 'bg-[#FFF4D9] text-[#A16A15]',
  'Reversed': 'bg-[#F2ECFA] text-[#7852A0]',
  'Failed': 'bg-[#FDECEA] text-[#C2413A]',
}

/** Status chip in the shipments StatusBadge style (customer status, transaction status). */
export function StatusChip({ value }: { value: string }) {
  if (!value) return <span className="text-[10px] text-[#91A098]">—</span>
  return <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-extrabold', statusTones[value] ?? 'bg-[#EFF3F0] text-[#6E7F77]')}><span className="h-1.5 w-1.5 rounded-full bg-current"/>{value}</span>
}

export function CustomerAvatar({ name, className }: { name: string; className?: string }) {
  return <span aria-hidden="true" className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF5E9] text-[11px] font-black text-[#438352]', className)}>{initials(name || '?')}</span>
}

/** Centered icon + title + note (+ action), like the Items empty state. */
export function EmptyState({ icon = 'users', title, note, action, className }: { icon?: IconName; title: string; note?: string; action?: ReactNode; className?: string }) {
  return <div className={cn('flex flex-col items-center px-5 py-10 text-center', className)}>
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF5E9] text-[#438352]"><Icon name={icon} size={22}/></div>
    <div className="mt-3 text-sm font-extrabold text-[#17382C]">{title}</div>
    {note && <div className="mt-1 max-w-xs text-xs font-medium leading-5 text-[#7D8E85]">{note}</div>}
    {action && <div className="mt-4">{action}</div>}
  </div>
}

/** Pill filter row (same look as the Items filters). Scrolls sideways on phones. */
export function FilterPills<T extends string>({ value, options, onChange, label }: { value: T; options: readonly { value: T; label: string }[]; onChange: (value: T) => void; label: string }) {
  return <div role="group" aria-label={label} className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
    {options.map(option => <button key={option.value} type="button" aria-pressed={value === option.value} onClick={() => onChange(option.value)} className={cn('shrink-0 rounded-full border px-3.5 py-1.5 text-[11px] font-extrabold transition-colors', value === option.value ? 'border-[#286B43] bg-[#286B43] text-white' : 'border-[#DFE7E2] text-[#53665D] hover:bg-[#F3F7F4]')}>{option.label}</button>)}
  </div>
}
