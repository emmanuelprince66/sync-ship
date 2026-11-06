import { Icon } from '@/components/ui/Icon'
import { Logo } from '@/components/ui/Logo'

export function StorefrontHeader({ count, onBack, onOpenCart }: { count: number; onBack: () => void; onOpenCart: () => void }) {
  return <header className="sticky top-0 z-20 border-b border-[#E2E9E5] bg-white/95 backdrop-blur">
    <div className="mx-auto flex h-[74px] max-w-6xl items-center justify-between px-5">
      <Logo/>
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} className="hidden text-xs font-extrabold text-[#60736A] sm:block">Back to dashboard</button>
        <button type="button" onClick={onOpenCart} aria-label={`Cart, ${count} items`} className="relative flex h-10 items-center gap-2 rounded-xl bg-[#09261C] px-4 text-xs font-extrabold text-white"><Icon name="card" size={17}/>Cart · {count}</button>
      </div>
    </div>
  </header>
}
