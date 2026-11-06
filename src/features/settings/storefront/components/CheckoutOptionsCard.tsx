import type { StorefrontProfile } from '@/api/storefront-settings'
import { Toggle } from '@/components/ui/Toggle'
import { BnplCard } from '@/features/bnpl'
import { useCheckoutOptions } from '../hooks/useCheckoutOptions'
import { SettingsCard } from './SettingsCard'

function OptionRow({ title, description, enabled, onChange, busy, badge }: { title: string; description: string; enabled: boolean; onChange: (value: boolean) => void; busy: boolean; badge?: string }) {
  return <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#E4EBE7] p-4">
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2"><span className="text-xs font-extrabold text-[#304B40]">{title}</span>{badge && <span className="rounded-full bg-[#E5F3E2] px-2 py-0.5 text-[9px] font-extrabold text-[#438052]">{badge}</span>}</div>
      <div className="mt-1 text-[10px] leading-4 text-[#8A9891]">{description}</div>
    </div>
    <div className={busy ? 'pointer-events-none opacity-50' : undefined} aria-busy={busy || undefined}><Toggle label={title} enabled={enabled} onChange={onChange}/></div>
  </div>
}

export function CheckoutOptionsCard({ profile }: { profile: StorefrontProfile }) {
  const options = useCheckoutOptions(profile)

  return <SettingsCard icon="card" title="Checkout options" description="How customers can pay and order from your store.">
    <div className="space-y-3">
      <BnplCard active={profile.enableBnpl}/>
      <OptionRow title="Sell without stock" description="Allow orders even when an item’s recorded stock is 0. Useful for made-to-order or pre-order items." enabled={options.sellWithoutStock} onChange={options.setSellWithoutStock} busy={options.stockSaving}/>
    </div>
  </SettingsCard>
}
