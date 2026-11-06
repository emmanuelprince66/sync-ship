import type { Ref, SelectHTMLAttributes } from 'react'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'
import type { Option } from '../options'

type OptionSelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> & {
  label: string
  options: readonly Option[]
  /** Shown while nothing is chosen (value ""). */
  placeholder: string
  error?: string
  ref?: Ref<HTMLSelectElement>
}

/**
 * SelectField with value/label pairs, an empty placeholder and an error line —
 * same look as the shared SelectField, which only takes plain strings.
 * Works with react-hook-form's register().
 */
export function OptionSelect({ label, options, placeholder, error, className, ref, ...props }: OptionSelectProps) {
  return <label className={cn('block', className)}>
    <span className="mb-2 block text-[12px] font-extrabold text-[#34483F]">{label}</span>
    <span className={cn('relative flex h-12 items-center rounded-xl border border-[#DCE7E0] bg-white px-3.5 transition focus-within:border-[#529661] focus-within:ring-4 focus-within:ring-[#529661]/10', error && 'border-[#E65A4F]')}>
      <select ref={ref} aria-invalid={error ? true : undefined} className="w-full min-w-0 appearance-none bg-transparent text-sm font-semibold text-[#09261C] outline-none invalid:text-[#9AABA3]" required {...props}>
        <option value="" disabled>{placeholder}</option>
        {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <Icon name="chevron" size={17}/>
    </span>
    {error && <span role="alert" className="mt-1.5 block text-[11px] font-semibold text-[#D15B50]">{error}</span>}
  </label>
}
