import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import { CommunicationsSection } from './CommunicationsSection'
import { useSettingsPage } from './hooks/useSettingsPage'
import { PaymentsSection } from './PaymentsSection'
import { SettingsNav } from './SettingsNav'
import { ShippingSection } from './ShippingSection'
import { StorefrontSettings } from './storefront/StorefrontSettings'
import { TeamSection } from './TeamSection'

/** Section heading + a two-column field grid, the shape every settings tab shares. */
function SectionSkeleton() {
  return <SkeletonGroup label="Loading settings">
    <Skeleton className="h-5 w-48"/>
    <Skeleton className="mt-2 h-3 w-72 max-w-full"/>
    <Skeleton className="mt-6 h-[52px] rounded-2xl"/>
    <div className="mt-6 grid gap-5 md:grid-cols-2">{Array.from({ length: 4 }, (_, index) => <div key={index}><Skeleton className="mb-2 h-3 w-24"/><Skeleton className="h-12 rounded-xl"/></div>)}</div>
  </SkeletonGroup>
}

export default function SettingsPage() {
  const { tab, selectTab, settings, isLoading } = useSettingsPage()

  return <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
    <SettingsNav active={tab} onSelect={selectTab}/>
    <div className="min-w-0 rounded-3xl border border-[#E0E8E3] bg-white p-5 sm:p-6 md:p-8">
      {isLoading || !settings ? <SectionSkeleton/> : <>
        {tab === 'Storefront' && <StorefrontSettings initial={settings.storefront} storeUrl={settings.storeUrl}/>}
        {tab === 'Shipping setup' && <ShippingSection/>}
        {tab === 'Payments & KYC' && <PaymentsSection initial={settings.payments}/>}
        {tab === 'Team & users' && <TeamSection/>}
        {tab === 'Communications' && <CommunicationsSection initial={settings.channels} storefront={settings.storefront}/>}
      </>}
    </div>
  </div>
}
