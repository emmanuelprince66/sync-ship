import type { Ref, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string; hint?: string; ref?: Ref<HTMLTextAreaElement> }

/** Multi-line version of the shared Field, same label/border/focus styling. */
export function TextAreaField({ label, error, hint, id, name, rows = 4, ref, ...props }: TextAreaFieldProps) {
  const inputId = id ?? (name ? `field-${name}` : undefined)
  return <label className="block" htmlFor={inputId}>
    <span className="mb-2 block text-[12px] font-extrabold text-[#34483F]">{label}</span>
    <textarea ref={ref} id={inputId} name={name} rows={rows} aria-invalid={error ? true : undefined} className={cn('block w-full resize-y rounded-xl border border-[#DCE7E0] bg-white px-3.5 py-3 text-sm font-semibold text-[#09261C] outline-none transition placeholder:font-medium placeholder:text-[#9AABA3] focus:border-[#529661] focus:ring-4 focus:ring-[#529661]/10', error && 'border-[#E65A4F] focus:border-[#E65A4F] focus:ring-[#E65A4F]/10')} {...props}/>
    {error ? <span role="alert" className="mt-1.5 block text-[11px] font-semibold text-[#D15B50]">{error}</span> : hint && <span className="mt-1.5 block text-[11px] text-[#7C8D85]">{hint}</span>}
  </label>
}
