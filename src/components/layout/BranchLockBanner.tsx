import { Link, useLocation } from 'react-router'
import { useBranchSubscription } from '@/api/plan'
import { Icon } from '@/components/ui/Icon'
import { usePermissions } from '@/hooks/usePermissions'
import { planPath } from '@/routes/paths'

/**
 * Shown across the app while the current business is a branch without its own plan (sink's
 * branchSubscription: is_founding === false && !is_subscribed). Hidden on the plan page, which explains it.
 */
export function BranchLockBanner() {
  const branch = useBranchSubscription()
  const { canManageSetup } = usePermissions()
  const { pathname } = useLocation()
  if (!branch.locked || pathname === planPath()) return null

  return <div role="status" className="mb-5 flex flex-col gap-3 rounded-2xl border border-[#F1DFB4] bg-[#FFF7E6] p-4 sm:flex-row sm:items-center">
    <div className="flex min-w-0 flex-1 items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#8D681D]"><Icon name="lock" size={17}/></span>
      <div className="min-w-0">
        <div className="text-xs font-extrabold text-[#6E5115]">{branch.branchName || 'This branch'} needs its own plan</div>
        <div className="mt-1 text-[10px] leading-4 text-[#927A48]">Only your first business is covered by your account plan. Until this branch is subscribed, adding attendants and a custom domain stay locked here.{canManageSetup ? '' : ' Ask the business owner to subscribe it.'}</div>
      </div>
    </div>
    {canManageSetup && <Link to={planPath()} className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#09261C] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#123D2E]">Choose a plan<Icon name="arrow" size={14}/></Link>}
  </div>
}
