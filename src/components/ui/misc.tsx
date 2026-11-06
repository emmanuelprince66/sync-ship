import { Icon } from './Icon'

/** "← Back to wallet" style link used on sub-screens. */
export function BackLink({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="mb-5 flex items-center gap-1 text-xs font-extrabold text-[#4A7D57]"><span className="rotate-180"><Icon name="arrow" size={15}/></span>{label}</button>
}

export function PageLoader() {
  return <div className="flex min-h-[40vh] items-center justify-center" role="status" aria-label="Loading">
    <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#529661] border-t-transparent"/>
  </div>
}
