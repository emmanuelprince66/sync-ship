import { useState } from 'react'
import { cn } from '@/lib/cn'
import { Icon } from './Icon'

type QuantityStepperProps = {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  /** Accessible name, e.g. "Quantity of Leather bag". */
  label: string
  /** "md" for list rows, "sm" for tight spots. Both keep 40px+ tap targets on phones. */
  size?: 'md' | 'sm'
  className?: string
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

/**
 * − [qty] + counter, as sink-inventory's POS cart: a pill with round buttons, the count in the
 * middle (typeable), minus disabled at the minimum and plus at the maximum.
 */
export function QuantityStepper({ value, onChange, min = 1, max = 999, label, size = 'md', className }: QuantityStepperProps) {
  /** What's being typed; null when the input just shows `value`. */
  const [draft, setDraft] = useState<string | null>(null)
  const commit = () => {
    if (draft === null) return
    const typed = Math.floor(Number(draft))
    if (draft.trim() !== '' && Number.isFinite(typed)) onChange(clamp(typed, min, max))
    setDraft(null)
  }
  const step = (delta: number) => { setDraft(null); onChange(clamp(value + delta, min, max)) }
  const button = cn(
    'flex shrink-0 items-center justify-center rounded-full border border-[#529661]/30 bg-white text-[#438352] transition hover:border-[#529661] hover:bg-[#EEF6ED] active:scale-95 disabled:cursor-not-allowed disabled:border-[#E2E9E5] disabled:text-[#B7C3BD] disabled:hover:bg-white',
    size === 'md' ? 'h-10 w-10 sm:h-9 sm:w-9' : 'h-10 w-10 sm:h-8 sm:w-8',
  )

  return <div role="group" aria-label={label} className={cn('inline-flex items-center gap-1 rounded-full border border-[#DCE7E0] bg-[#F4F8F5] p-1', className)}>
    <button type="button" aria-label="Decrease quantity" disabled={value <= min} onClick={() => step(-1)} className={button}><Icon name="minus" size={16} stroke={2.4}/></button>
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      aria-label={label}
      value={draft ?? String(value)}
      onFocus={event => event.target.select()}
      onChange={event => setDraft(event.target.value.replace(/\D/g, '').slice(0, String(max).length))}
      onBlur={commit}
      onKeyDown={event => {
        if (event.key === 'Enter') { event.preventDefault(); commit() }
        else if (event.key === 'ArrowUp') { event.preventDefault(); step(1) }
        else if (event.key === 'ArrowDown') { event.preventDefault(); step(-1) }
      }}
      className={cn('min-w-0 bg-transparent text-center font-extrabold text-[#09261C] outline-none', size === 'md' ? 'w-10 text-base' : 'w-8 text-sm')}
    />
    <button type="button" aria-label="Increase quantity" disabled={value >= max} onClick={() => step(1)} className={button}><Icon name="plus" size={16} stroke={2.4}/></button>
  </div>
}
