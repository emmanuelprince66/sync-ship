import type { StorefrontProfile } from '@/api/storefront-settings'
import { Button } from '@/components/ui/Button'
import { SegmentedTabs } from '@/components/ui/common'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'
import { channelOptions, useStoreLink } from '../hooks/useStoreLink'
import { CustomDomainModal } from './CustomDomainModal'
import { SettingsCard } from './SettingsCard'

const domainBadge = {
  connected: { label: 'Connected', className: 'bg-[#E4F2E1] text-[#438352]' },
  pending: { label: 'Awaiting DNS', className: 'bg-[#FFF0D0] text-[#956616]' },
} as const

export function StoreLinkCard({ profile }: { profile: StorefrontProfile }) {
  const link = useStoreLink(profile)

  return <SettingsCard icon="link" title="Store link" description="Where customers find you online and in person.">
    <SegmentedTabs value={link.channel} onChange={link.setChannel} options={channelOptions} className="grid grid-cols-2 gap-1 rounded-xl bg-[#EAF1EC] p-1 sm:w-fit" buttonClassName="rounded-lg px-5 py-2 text-xs font-extrabold transition"/>
    <div className="mt-4 flex flex-col gap-2 rounded-xl border border-[#DCE6E0] bg-[#F8FAF8] p-2 sm:flex-row sm:items-center sm:pl-4">
      <div className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1 text-[#345044] sm:px-0"><Icon name="link" size={16}/><span className="truncate text-xs font-bold">{link.displayUrl}</span></div>
      <div className="grid grid-cols-2 gap-2 sm:flex">
        <Button variant="outline" icon="arrow" onClick={link.openUrl} className="py-2 text-xs">Open</Button>
        <Button variant={link.copied ? 'secondary' : 'primary'} icon={link.copied ? 'check' : 'copy'} onClick={link.copyUrl} className="py-2 text-xs">{link.copied ? 'Copied' : 'Copy link'}</Button>
      </div>
    </div>
    <p className="mt-2 text-[10px] leading-4 text-[#829189]">{link.hint}</p>

    <div className="mt-5 flex flex-col gap-3 rounded-xl bg-[#F4F8F5] p-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2"><span className="text-xs font-extrabold text-[#28483B]">Custom domain</span>{link.domainStatus !== 'none' && <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-extrabold', domainBadge[link.domainStatus].className)}>{domainBadge[link.domainStatus].label}</span>}</div>
        <div className="mt-1 truncate text-[10px] text-[#7C8D85]">{link.domain || 'Use your own address, like shop.yourbusiness.com'}</div>
      </div>
      <Button variant="outline" icon={link.domain ? 'settings' : 'plus'} onClick={link.domainDialog.open} className="py-2 text-xs">{link.domain ? 'Change domain' : 'Connect domain'}</Button>
    </div>
    <CustomDomainModal open={link.domainDialog.isOpen} onClose={link.domainDialog.close} currentDomain={link.domain}/>
  </SettingsCard>
}
