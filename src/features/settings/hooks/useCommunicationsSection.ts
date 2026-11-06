import { isLive } from '@/api/http'
import type { ChannelSettings } from '@/api/types'
import { useSectionDraft } from './useSectionDraft'

/** No notification-preference endpoint exists in Sync360 yet, so live mode shows this tab as coming soon. */
export const useCommunicationsSection = (initial: ChannelSettings) => {
  const section = useSectionDraft('channels', initial, 'Communication preferences saved')
  const toggle = (key: keyof ChannelSettings, enabled: boolean) => section.update({ [key]: enabled })
  return { channels: section.draft, toggle, save: section.save, saving: section.saving, comingSoon: isLive() }
}
