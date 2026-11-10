import type { StorefrontSource } from '@/api/items'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { useClipboard } from '@/hooks/useClipboard'
import { cn } from '@/lib/cn'

type StorefrontCardProps = { storeUrl: string; onViewStorefront: () => void; source: StorefrontSource; sourceDisabled: boolean; onSourceChange: (source: StorefrontSource) => void }

const SOURCES: { value: StorefrontSource; label: string }[] = [{ value: 'VIRTUAL', label: 'These items' }, { value: 'INVENTORY', label: 'Inventory' }]

const withProtocol = (url: string) => (/^https?:\/\//i.test(url) ? url : `https://${url}`)

export function StorefrontCard({ storeUrl, onViewStorefront, source, sourceDisabled, onSourceChange }: StorefrontCardProps) {
  const { copied, copy } = useClipboard()
  return <div className="overflow-hidden rounded-3xl bg-[#09261C] p-6 text-white">
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10"><Icon name="building" size={20}/></div>
    <div className="mt-5 text-lg font-black">Your online storefront</div>
    <div className="mt-2 text-xs leading-5 text-white/60">Customers can browse available products, pay, and arrange delivery from one link.</div>
    <div className="mt-5 rounded-xl bg-white/10 p-3">
      <div className="text-[9px] font-bold uppercase tracking-[.1em] text-white/45">Store URL</div>
      <div className="mt-2 flex items-center gap-2"><div className="min-w-0 flex-1 truncate text-[11px] font-bold">{storeUrl.replace(/^https?:\/\//i, '')}</div><button type="button" aria-label="Copy store URL" onClick={() => copy(withProtocol(storeUrl))} className="text-[#A5D86A]"><Icon name={copied ? 'check' : 'copy'} size={16}/></button></div>
    </div>
    <div className="mt-3 rounded-xl bg-white/10 p-3">
      <div className="text-[9px] font-bold uppercase tracking-[.1em] text-white/45">Store shows</div>
      <div role="radiogroup" aria-label="Storefront products" className="mt-2 grid grid-cols-2 gap-1 rounded-lg bg-black/20 p-1">
        {SOURCES.map(option => <button key={option.value} type="button" role="radio" aria-checked={source === option.value} disabled={sourceDisabled} onClick={() => onSourceChange(option.value)} className={cn('rounded-md px-2 py-1.5 text-[11px] font-extrabold transition-colors disabled:opacity-60', source === option.value ? 'bg-white text-[#09261C]' : 'text-white/70 hover:text-white')}>{option.label}</button>)}
      </div>
    </div>
    <Button variant="secondary" onClick={onViewStorefront} className="mt-4 w-full">View storefront <Icon name="arrow" size={15}/></Button>
  </div>
}
