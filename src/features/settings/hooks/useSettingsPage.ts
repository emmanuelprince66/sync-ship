import { useNavigate, useParams } from 'react-router'
import { useBusinessSettings } from '@/api/settings'
import type { SettingsSection } from '@/api/types'
import { sectionFromSlug, settingsPath } from '@/routes/paths'

export const useSettingsPage = () => {
  const navigate = useNavigate()
  const { section: slug } = useParams<{ section: string }>()
  const { data: settings, isLoading } = useBusinessSettings()
  return {
    tab: sectionFromSlug(slug),
    selectTab: (section: SettingsSection) => navigate(settingsPath(section)),
    settings,
    isLoading: isLoading || !settings,
  }
}
