import type { ChannelSettings, StorefrontSettings } from '@/api/types'
import { Icon, type IconName } from '@/components/ui/Icon'
import { Toggle } from '@/components/ui/Toggle'
import { cn } from '@/lib/cn'
import { useCommunicationsSection } from './hooks/useCommunicationsSection'
import { SaveBar, SectionHeading } from './shared'

export function CommunicationsSection({ initial, storefront }: { initial: ChannelSettings; storefront: StorefrontSettings }) {
  const { channels, toggle, save, saving, comingSoon } = useCommunicationsSection(initial)

  const channelCards: { key: 'email' | 'sms' | 'whatsapp'; title: string; text: string; icon: IconName }[] = [
    { key: 'email', title: 'Email', text: storefront.email, icon: 'card' },
    { key: 'sms', title: 'SMS', text: storefront.phone, icon: 'bell' },
    { key: 'whatsapp', title: 'WhatsApp', text: storefront.whatsapp, icon: 'help' },
  ]
  const updates: { key: 'order' | 'payout'; title: string; text: string }[] = [
    { key: 'order', title: 'Order and shipping updates', text: 'Checkout completed, rider assigned, in transit, and delivered.' },
    { key: 'payout', title: 'Payment and payout updates', text: 'Customer payments, wallet credits, and withdrawals.' },
  ]

  return <>
    <SectionHeading title="Communication channels" description="Choose how you and your customers receive important updates."/>
    {comingSoon && <div className="mt-6 flex items-start gap-2 rounded-2xl bg-[#FFF7E6] p-4 text-[11px] leading-5 text-[#8D681D]"><Icon name="clock" size={16}/><span>Notification preferences are coming soon. Order and payout updates are currently sent to your account email and phone.</span></div>}
    <fieldset disabled={comingSoon} className={cn('min-w-0', comingSoon && 'pointer-events-none opacity-55')}>
    <div className="mt-6 grid gap-3 md:grid-cols-3">{channelCards.map(channel => <div key={channel.key} className={cn('rounded-2xl border p-4', channels[channel.key] ? 'border-[#BFD9C3] bg-[#F5FAF4]' : 'border-[#E2E9E5]')}>
      <div className="flex items-center justify-between"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#438352]"><Icon name={channel.icon} size={17}/></div><Toggle label={channel.title} enabled={channels[channel.key]} onChange={enabled => toggle(channel.key, enabled)}/></div>
      <div className="mt-3 text-xs font-extrabold text-[#304B40]">{channel.title}</div><div className="mt-1 truncate text-[9px] text-[#8A9891]">{channel.text}</div>
    </div>)}</div>
    <div className="mt-6 space-y-3">{updates.map(setting => <div key={setting.key} className="flex items-center justify-between rounded-2xl border border-[#E4EBE7] p-4">
      <div><div className="text-xs font-extrabold text-[#304B40]">{setting.title}</div><div className="mt-1 text-[10px] text-[#8A9891]">{setting.text}</div></div>
      <Toggle label={setting.title} enabled={channels[setting.key]} onChange={enabled => toggle(setting.key, enabled)}/>
    </div>)}</div>
    </fieldset>
    {!comingSoon && <SaveBar saving={saving} onSave={save}/>}
  </>
}
