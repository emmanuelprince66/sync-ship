import { FilePicker } from '@/components/ui/common'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'

/** One required document: label + hint, then the chosen file or an upload button. */
export function DocumentUpload({ label, hint, accept, file, error, onChange }: {
  label: string
  hint: string
  accept: string
  file: File | null
  error?: string
  onChange: (file: File | null) => void
}) {
  return <div className={cn('flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center', error ? 'border-[#F2C4BF] bg-[#FFF8F7]' : file ? 'border-[#D5E8D3] bg-[#F7FBF6]' : 'border-[#E2E9E5] bg-white')}>
    <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', file ? 'bg-[#E4F2E1] text-[#438352]' : 'bg-[#F0F4F1] text-[#6A7C73]')}><Icon name={file ? 'check' : 'download'} size={17}/></div>
    <div className="min-w-0 flex-1">
      <div className="text-xs font-extrabold text-[#28483B]">{label}</div>
      <div className="mt-0.5 truncate text-[10px] text-[#829189]">{file ? file.name : hint}</div>
      {error && <div role="alert" className="mt-1 text-[10px] font-semibold text-[#D15B50]">{error}</div>}
    </div>
    <div className="flex shrink-0 items-center gap-2">
      {file && <button type="button" onClick={() => onChange(null)} aria-label={`Remove ${label}`} className="rounded-lg p-2 text-[#A0ADA6] hover:bg-[#FFF0EE] hover:text-[#D15B50]"><Icon name="trash" size={15}/></button>}
      <FilePicker accept={accept} onFile={onChange} className="inline-flex items-center justify-center rounded-xl border border-[#DCE7E0] bg-white px-3.5 py-2 text-[11px] font-extrabold text-[#09261C] transition hover:border-[#529661]">
        {file ? 'Replace' : 'Upload'}
      </FilePicker>
    </div>
  </div>
}
