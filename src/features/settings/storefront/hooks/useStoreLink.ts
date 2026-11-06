import { useState } from 'react'
import { getStoreUrl, type StoreChannel, type StorefrontProfile } from '@/api/storefront-settings'
import { useClipboard } from '@/hooks/useClipboard'
import { useDisclosure } from '@/hooks/useDisclosure'

export const channelOptions = [
  { value: 'OUTSTORE', label: 'Online store' },
  { value: 'INSTORE', label: 'In-store' },
] as const satisfies readonly { value: StoreChannel; label: string }[]

const channelHint: Record<StoreChannel, string> = {
  OUTSTORE: 'Share on WhatsApp, Instagram and your bio. Customers browse, pay and arrange delivery.',
  INSTORE: 'For walk-in customers. Print it as a QR code at your counter to take orders in person.',
}

/** Store link card: channel switch, copy/open, and the custom-domain dialog. */
export function useStoreLink(profile: StorefrontProfile) {
  const [channel, setChannel] = useState<StoreChannel>('OUTSTORE')
  const { copied, copy } = useClipboard()
  const domainDialog = useDisclosure()
  const url = getStoreUrl(profile, channel)

  const domainStatus: 'none' | 'connected' | 'pending' = !profile.customDomain ? 'none' : profile.customDomainApproved ? 'connected' : 'pending'

  return {
    channel,
    setChannel,
    url,
    displayUrl: url.replace(/^https?:\/\//, ''),
    hint: channelHint[channel],
    copied,
    copyUrl: () => copy(url),
    openUrl: () => window.open(url, '_blank', 'noopener,noreferrer'),
    domain: profile.customDomain,
    domainStatus,
    domainDialog,
  }
}
