import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { useClipboard } from '@/hooks/useClipboard'

export function StorefrontCard({ storeUrl, onViewStorefront }: { storeUrl: string; onViewStorefront: () => void }) {
  const { copied, copy } = useClipboard()
  return <div className="overflow-hidden rounded-3xl bg-[#09261C] p-6 text-white">
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10"><Icon name="building" size={20}/></div>
    <div className="mt-5 text-lg font-black">Your online storefront</div>
    <div className="mt-2 text-xs leading-5 text-white/60">Customers can browse available products, pay, and arrange delivery from one link.</div>
    <div className="mt-5 rounded-xl bg-white/10 p-3">
      <div className="text-[9px] font-bold uppercase tracking-[.1em] text-white/45">Store URL</div>
      <div className="mt-2 flex items-center gap-2"><div className="min-w-0 flex-1 truncate text-[11px] font-bold">{storeUrl}</div><button type="button" aria-label="Copy store URL" onClick={() => copy(`https://${storeUrl}`)} className="text-[#A5D86A]"><Icon name={copied ? 'check' : 'copy'} size={16}/></button></div>
    </div>
    <Button variant="secondary" onClick={onViewStorefront} className="mt-4 w-full">View storefront <Icon name="arrow" size={15}/></Button>
  </div>
}
