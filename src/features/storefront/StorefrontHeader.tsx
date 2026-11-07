import { Icon } from '@/components/ui/Icon'
import { Logo } from '@/components/ui/Logo'

export function StorefrontHeader({ count, onBack, onOpenCart }: { count: number; onBack: () => void; onOpenCart: () => void }) {
  return <header className="sticky top-0 z-20 border-b border-[#E2E9E5] bg-white/95 backdrop-blur">
    <div className="mx-auto flex h-[74px] max-w-6xl items-center justify-between px-5">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" onClick={onBack} className="flex h-9 items-center gap-1.5 rounded-xl border border-[#E0E8E3] px-2.5 text-xs font-extrabold text-[#34483F] hover:bg-[#F3F7F4]"><span className="rotate-180"><Icon name="arrow" size={15}/></span><span className="hidden sm:inline">Back to dashboard</span><span className="sm:hidden">Back</span></button>
        <span className="hidden sm:block"><Logo/></span>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={onOpenCart} aria-label={`Cart, ${count} items`} className="relative flex h-10 items-center gap-2 rounded-xl bg-[#09261C] px-4 text-xs font-extrabold text-white"><Icon name="card" size={17}/>Cart · {count}</button>
      </div>
    </div>
  </header>
}
