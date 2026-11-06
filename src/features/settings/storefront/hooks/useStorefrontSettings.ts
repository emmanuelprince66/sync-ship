import { toast } from 'sonner'
import { isLive } from '@/api/http'
import { useStorefrontProfile, useStoreThemes } from '@/api/storefront-settings'
import type { StorefrontSettings } from '@/api/types'
import { useSectionDraft } from '../../hooks/useSectionDraft'

/**
 * Root data for Settings › Storefront: the live store profile and theme list,
 * plus the design's "store live" / analytics switches (no backend field yet,
 * so they persist through the settings sample store and save on toggle).
 */
export function useStorefrontSettings(initial: StorefrontSettings) {
  const profile = useStorefrontProfile()
  const themes = useStoreThemes()
  const { draft, update, saveWith, saving } = useSectionDraft('storefront', initial, 'Storefront updated')

  const setActive = (active: boolean) => {
    update({ active })
    saveWith({ ...draft, active }, active ? 'Your storefront is live' : 'Your storefront is now hidden')
  }
  const setAnalytics = (analytics: boolean) => {
    update({ analytics })
    saveWith({ ...draft, analytics }, analytics ? 'Storefront analytics turned on' : 'Storefront analytics turned off')
  }

  return {
    profile: profile.data,
    themes: themes.data ?? [],
    isLoading: profile.isLoading || (!profile.data && !profile.isError),
    isError: profile.isError,
    retry: () => { profile.refetch().catch(() => toast.error('Could not load your store')) },
    // The backend has no live/hidden or analytics field, so live mode hides those switches instead of faking them.
    status: { editable: !isLive(), active: draft.active, analytics: draft.analytics, setActive, setAnalytics, saving },
  }
}
