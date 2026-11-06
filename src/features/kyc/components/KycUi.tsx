import type { ReactNode, Ref, SelectHTMLAttributes } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { Field } from '@/components/ui/Field'
import { Icon, type IconName } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'

/** The panel every tier form sits in (sink's TierPanel). */
export function TierPanel({ tier, title, description, aside, children }: { tier: number; title: string; description: string; aside?: ReactNode; children: ReactNode }) {
  return <section className="rounded-3xl border border-[#E0E8E3] bg-white p-5 sm:p-6">
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[#EDF1EF] pb-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF5E9] text-[#438352]"><Icon name="shield" size={20}/></span>
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#438352]">Tier {tier}</p>
          <h2 className="text-base font-black text-[#17382C] sm:text-lg">{title}</h2>
          <p className="mt-0.5 text-xs text-[#7C8D85]">{description}</p>
        </div>
      </div>
      {aside}
    </header>
    <div className="pt-5">{children}</div>
  </section>
}

export function LimitChip({ limit }: { limit: string }) {
  return <span className="rounded-full bg-[#EAF5E9] px-3 py-1.5 text-[11px] font-extrabold text-[#286B43]">Unlocks {limit} daily</span>
}

const NOTICE_TONES: Record<'info' | 'warning' | 'success' | 'locked', { wrap: string; icon: string; title: string; Icon: IconName }> = {
  info: { wrap: 'border-[#D6E3F7] bg-[#F1F6FD]', icon: 'text-[#426AB2]', title: 'text-[#2F518F]', Icon: 'help' },
  warning: { wrap: 'border-[#F2DFB0] bg-[#FFF8E8]', icon: 'text-[#A16A15]', title: 'text-[#8D5A10]', Icon: 'bell' },
  success: { wrap: 'border-[#CFE4CD] bg-[#EEF8EC]', icon: 'text-[#438352]', title: 'text-[#286B43]', Icon: 'shield' },
  locked: { wrap: 'border-[#E2E9E5] bg-[#F4F7F5]', icon: 'text-[#7C8D85]', title: 'text-[#4E625A]', Icon: 'shield' },
}

export function Notice({ tone = 'info', title, children, className }: { tone?: keyof typeof NOTICE_TONES; title?: string; children: ReactNode; className?: string }) {
  const style = NOTICE_TONES[tone]
  return <div className={cn('flex gap-3 rounded-2xl border p-4', style.wrap, className)}>
    <span className={cn('mt-0.5 shrink-0', style.icon)}><Icon name={style.Icon} size={17}/></span>
    <div className="min-w-0 text-xs leading-5">
      {title && <p className={cn('mb-0.5 text-[13px] font-extrabold', style.title)}>{title}</p>}
      <div className="text-[#4E625A]">{children}</div>
    </div>
  </div>
}

export function SectionHeading({ title, description, meta }: { title: string; description?: string; meta?: string }) {
  return <div className="flex flex-wrap items-baseline justify-between gap-2">
    <div>
      <h3 className="text-[11px] font-extrabold uppercase tracking-[.1em] text-[#34483F]">{title}</h3>
      {description && <p className="mt-1 text-xs text-[#7C8D85]">{description}</p>}
    </div>
    {meta && <span className="text-[11px] font-extrabold text-[#438352]">{meta}</span>}
  </div>
}

/** Read-only recap of what the earlier tiers captured. */
export function CapturedSummary({ items }: { items: { label: string; value: string }[] }) {
  return <div className="flex flex-wrap gap-x-6 gap-y-3 rounded-2xl border border-[#CFE4CD] bg-[#F3F9F2] p-4">
    {items.map(item => <div key={item.label}>
      <p className="text-[10px] font-extrabold uppercase tracking-[.08em] text-[#7C8D85]">{item.label}</p>
      <p className="text-sm font-bold text-[#17382C]">{item.value}</p>
    </div>)}
  </div>
}

/** Primary submit button at the foot of a tier form. */
export function SubmitButton({ pending, children }: { pending: boolean; children: ReactNode }) {
  return <button type="submit" disabled={pending} aria-busy={pending || undefined} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#09261C] px-4 text-sm font-bold text-white shadow-[0_5px_14px_rgba(9,38,28,.16)] transition-all hover:bg-[#123D2E] disabled:cursor-not-allowed disabled:opacity-45">
    {pending ? <span className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true"/> : children}
  </button>
}

export type Option = { value: string; label: string }

/** Select with value/label pairs, a placeholder and an error line; works with register(). */
export function KycSelect({ label, options, placeholder, error, ref, ...props }: Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> & { label: string; options: readonly Option[]; placeholder: string; error?: string; ref?: Ref<HTMLSelectElement> }) {
  return <label className="block">
    <span className="mb-2 block text-[12px] font-extrabold text-[#34483F]">{label}</span>
    <span className={cn('relative flex h-12 items-center rounded-xl border border-[#DCE7E0] bg-white px-3.5 transition focus-within:border-[#529661] focus-within:ring-4 focus-within:ring-[#529661]/10', error && 'border-[#E65A4F]')}>
      <select ref={ref} aria-invalid={error ? true : undefined} className="w-full min-w-0 appearance-none bg-transparent text-sm font-semibold text-[#09261C] outline-none" {...props}>
        <option value="" disabled>{placeholder}</option>
        {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <Icon name="chevron" size={17}/>
    </span>
    {error && <span role="alert" className="mt-1.5 block text-[11px] font-semibold text-[#D15B50]">{error}</span>}
  </label>
}

/** 11-digit NIN/BVN input: digits only, max 11. Pass `form.register(name)`. */
export function DigitsField({ registration, label, placeholder, error }: { registration: UseFormRegisterReturn; label: string; placeholder: string; error?: string }) {
  return <Field
    label={label}
    inputMode="numeric"
    maxLength={11}
    placeholder={placeholder}
    error={error}
    {...registration}
    onChange={event => {
      event.target.value = event.target.value.replace(/\D/g, '')
      registration.onChange(event)
    }}
  />
}
