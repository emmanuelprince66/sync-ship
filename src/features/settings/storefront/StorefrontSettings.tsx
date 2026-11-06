import type { StorefrontSettings as StorefrontStatus } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { Toggle } from '@/components/ui/Toggle'
import { cn } from '@/lib/cn'
import { SectionHeading } from '../shared'
import { BrandingCard } from './components/BrandingCard'
import { CheckoutOptionsCard } from './components/CheckoutOptionsCard'
import { StoreDetailsCard } from './components/StoreDetailsCard'
import { StoreHoursCard } from './components/StoreHoursCard'
import { StoreLinkCard } from './components/StoreLinkCard'
import { StorefrontSkeleton } from './components/StorefrontSkeleton'
import { useStorefrontSettings } from './hooks/useStorefrontSettings'

/**
 * Settings › Storefront. Keeps the design's live/hidden banner and analytics
 * switch, and adds sink-inventory's store settings as cards: link & custom
 * domain, branding & theme, details & contact, opening/delivery days, checkout options.
 * Each card saves on its own.
 */
export function StorefrontSettings({ initial, storeUrl }: { initial: StorefrontStatus; storeUrl: string }) {
  const { profile, themes, isLoading, isError, retry, status } = useStorefrontSettings(initial)

  return <>
    <div className="flex items-start justify-between gap-4"><SectionHeading title="Storefront settings" description="Control your public store, branding, contact channels and checkout."/>{status.editable && <Toggle label="Storefront live" enabled={status.active} onChange={status.setActive}/>}</div>
    {status.editable ? <div className={cn('mt-6 rounded-2xl p-4 text-xs font-bold', status.active ? 'bg-[#EDF7EC] text-[#467151]' : 'bg-[#F3F5F4] text-[#7A8881]')}>
      <div className="flex items-center gap-2"><span className={cn('h-2 w-2 rounded-full', status.active ? 'bg-[#529661]' : 'bg-[#AAB5AF]')}/>{status.active ? 'Your storefront is live' : 'Your storefront is currently hidden'}</div>
      <div className="mt-1 truncate pl-4 text-[10px] font-medium opacity-75">{storeUrl}</div>
    </div> : storeUrl && <div className="mt-6 rounded-2xl bg-[#EDF7EC] p-4 text-xs font-bold text-[#467151]">
      <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#529661]"/>Your store link</div>
      <div className="mt-1 truncate pl-4 text-[10px] font-medium opacity-75">{storeUrl}</div>
    </div>}

    {isLoading && <StorefrontSkeleton/>}
    {isError && <div className="mt-6 rounded-2xl border border-dashed border-[#E2C9C5] bg-[#FFF8F7] p-6 text-center"><div className="text-xs font-extrabold text-[#9A4B42]">We couldn’t load your store settings.</div><Button variant="outline" icon="arrow" onClick={retry} className="mt-4 py-2 text-xs">Try again</Button></div>}
    {profile && <div className="mt-6 space-y-5">
      <StoreLinkCard profile={profile}/>
      <BrandingCard profile={profile} themes={themes}/>
      <StoreDetailsCard profile={profile}/>
      <StoreHoursCard profile={profile}/>
      <CheckoutOptionsCard profile={profile}/>
    </div>}

    {status.editable && <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-[#E2E9E5] p-4"><div><div className="text-xs font-extrabold text-[#304B40]">Storefront analytics</div><div className="mt-1 text-[10px] text-[#8A9891]">Track visits, product views, abandoned carts, and completed sales.</div></div><Toggle label="Storefront analytics" enabled={status.analytics} onChange={status.setAnalytics}/></div>}
  </>
}
