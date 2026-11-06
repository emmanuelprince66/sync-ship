import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { IconTile } from '@/components/ui/common'
import type { IconName } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'

/** Bordered sub-card used for each storefront settings group. */
export function SettingsCard({ icon, title, description, action, children, className }: {
  icon: IconName
  title: string
  description: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return <section className={cn('rounded-2xl border border-[#E2E9E5] p-4 sm:p-5', className)}>
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <IconTile icon={icon} size={17} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EAF5E9] text-[#438352]"/>
        <div className="min-w-0"><h3 className="text-sm font-extrabold text-[#17382C]">{title}</h3><p className="mt-0.5 text-[11px] leading-4 text-[#84938C]">{description}</p></div>
      </div>
      {action}
    </div>
    <div className="mt-5">{children}</div>
  </section>
}

/** Discard / Save row that appears once a card has unsaved changes. */
export function CardActions({ dirty, saving, onReset, onSave, saveLabel = 'Save changes', type = 'button' }: {
  dirty: boolean
  saving: boolean
  onReset: () => void
  onSave?: () => void
  saveLabel?: string
  type?: 'button' | 'submit'
}) {
  return <div className="mt-5 flex flex-col-reverse gap-2 border-t border-[#EDF1EF] pt-4 sm:flex-row sm:items-center sm:justify-end">
    {dirty && <span className="text-[10px] font-bold text-[#A16A15] sm:mr-auto">You have unsaved changes</span>}
    <Button variant="ghost" onClick={onReset} disabled={!dirty || saving}>Discard</Button>
    <Button type={type} onClick={onSave} loading={saving} disabled={!dirty}>{saveLabel}</Button>
  </div>
}
