import { Link } from 'react-router'
import { cn } from '@/lib/cn'
import { planPath } from '@/routes/paths'
import { Icon } from './Icon'

/**
 * Soft plan gate: a friendly note in place of an action the plan doesn't allow, with a link to
 * Settings → Plan & billing. `compact` fits inside a card row.
 */
export function PlanGateNotice({ title, body, className, compact = false, linkLabel = 'See plans' }: { title: string; body?: string; className?: string; compact?: boolean; linkLabel?: string }) {
  return <div role="status" className={cn('flex items-start gap-3 rounded-2xl border border-[#F1DFB4] bg-[#FFF7E6]', compact ? 'p-3' : 'p-4', className)}>
    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-[#8D681D]"><Icon name="lock" size={16}/></span>
    <div className="min-w-0 flex-1">
      <div className="text-xs font-extrabold text-[#6E5115]">{title}</div>
      {body && <div className="mt-1 text-[10px] leading-4 text-[#927A48]">{body}</div>}
      <Link to={planPath()} className="mt-2 inline-flex items-center gap-1 text-[11px] font-extrabold text-[#438352] hover:text-[#09261C]">{linkLabel}<Icon name="arrow" size={13}/></Link>
    </div>
  </div>
}
