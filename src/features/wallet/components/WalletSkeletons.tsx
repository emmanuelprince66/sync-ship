import { ListSkeleton, Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'

/** Same layout as WalletPage while the wallet loads. */
export function WalletOverviewSkeleton() {
  return <SkeletonGroup label="Loading wallet" className="space-y-6">
    <div><Skeleton className="h-6 w-24"/><Skeleton className="mt-2 h-3 w-64 max-w-full"/></div>
    <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
      <div className="rounded-3xl bg-[#09261C] p-7">
        <Skeleton className="h-3 w-28 bg-white/10"/>
        <Skeleton className="mt-4 h-9 w-56 max-w-full bg-white/10"/>
        <div className="mt-8 flex gap-3"><Skeleton className="h-10 w-36 rounded-xl bg-white/10"/><Skeleton className="h-10 w-32 rounded-xl bg-white/10"/></div>
      </div>
      <div className="rounded-3xl border border-[#E0E8E3] bg-white p-6">
        <div className="flex justify-between"><Skeleton className="h-4 w-36"/><Skeleton className="h-3 w-8"/></div>
        <div className="mt-6 flex items-center gap-4"><Skeleton className="h-12 w-12 rounded-xl"/><div className="space-y-2"><Skeleton className="h-3 w-40"/><Skeleton className="h-2.5 w-32"/></div></div>
        <Skeleton className="mt-5 h-8 w-full"/>
      </div>
    </div>
    <div className="rounded-2xl border border-[#E2EAE5] bg-white p-6"><Skeleton className="h-4 w-40"/><ListSkeleton rows={4}/></div>
  </SkeletonGroup>
}

/** Fund / withdraw cards while loading. */
export function WalletFormSkeleton() {
  return <SkeletonGroup label="Loading" className="mx-auto max-w-2xl">
    <Skeleton className="mb-5 h-3 w-28"/>
    <div className="rounded-3xl border border-[#E0E8E3] bg-white p-6 md:p-8">
      <Skeleton className="h-12 w-12 rounded-2xl"/>
      <Skeleton className="mt-5 h-6 w-48"/>
      <Skeleton className="mt-2 h-3 w-full"/>
      <Skeleton className="mt-7 h-36 w-full rounded-2xl"/>
      <div className="mt-7 space-y-3"><Skeleton className="h-3 w-3/4"/><Skeleton className="h-3 w-2/3"/><Skeleton className="h-3 w-1/2"/></div>
    </div>
  </SkeletonGroup>
}
