import { cn } from '@/lib/cn'

/** `loading` shows a small spinner in the knob and blocks clicks while a save is in flight. */
export function Toggle({ enabled, onChange, label, loading = false }: { enabled: boolean; onChange: (enabled: boolean) => void; label?: string; loading?: boolean }) {
  return <button type="button" role="switch" aria-checked={enabled} aria-label={label} aria-busy={loading || undefined} disabled={loading} onClick={() => onChange(!enabled)} className={cn('flex h-6 w-11 items-center rounded-full p-0.5 transition disabled:cursor-wait', enabled ? 'justify-end bg-[#529661]' : 'justify-start bg-[#D7E0DB]')}>
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white shadow">
      {loading && <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#529661] border-t-transparent" aria-hidden="true"/>}
    </span>
  </button>
}
