import type { Ref, SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { Icon } from './Icon'

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  /** Pass "" to render without a visible label (the design does this in the shipments toolbar). */
  label: string
  options: readonly string[]
  onValueChange?: (value: string) => void
  /** Overrides for the bordered box, e.g. "h-10" in toolbars. */
  boxClassName?: string
  ref?: Ref<HTMLSelectElement>
}

export function SelectField({ label, options, onValueChange, onChange, boxClassName, ref, ...props }: SelectFieldProps) {
  return <label className="block">
    {label && <span className="mb-2 block text-[12px] font-extrabold text-[#34483F]">{label}</span>}
    <span className={cn('relative flex h-12 items-center rounded-xl border border-[#DCE7E0] bg-white px-3.5 transition focus-within:border-[#529661] focus-within:ring-4 focus-within:ring-[#529661]/10', boxClassName)}>
      <select
        ref={ref}
        aria-label={label || props['aria-label']}
        onChange={event => { onChange?.(event); onValueChange?.(event.target.value) }}
        className="w-full appearance-none bg-transparent text-sm font-semibold text-[#09261C] outline-none"
        {...props}
      >
        {options.map(option => <option key={option}>{option}</option>)}
      </select>
      <Icon name="chevron" size={17}/>
    </span>
  </label>
}
