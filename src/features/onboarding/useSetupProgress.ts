import { useKycStatus } from '@/api/kyc'
import { useBusinessSettings } from '@/api/settings'
import { useShipbubbleSettings } from '@/api/shipping-settings'
import type { SettingsSection } from '@/api/types'
import type { IconName } from '@/components/ui/Icon'

export type SetupStep = { title: string; text: string; section: SettingsSection; icon: IconName; done: boolean }

/** Onboarding checklist, read from the real business, Shipbubble and KYC state. */
export function useSetupProgress() {
  const settings = useBusinessSettings()
  const shipbubble = useShipbubbleSettings()
  const kyc = useKycStatus()
  const storefront = settings.data?.storefront

  const steps: SetupStep[] = [
    { title: 'Business profile', text: 'Your basic business information is ready.', section: 'Storefront', icon: 'building', done: Boolean(storefront?.name) },
    { title: 'Set up your storefront', text: 'Add store contacts, WhatsApp, and customer channels.', section: 'Storefront', icon: 'link', done: Boolean(storefront?.phone && storefront.whatsapp && storefront.email) },
    { title: 'Activate shipping', text: 'Confirm pickup details and connect a delivery partner.', section: 'Shipping setup', icon: 'truck', done: Boolean(shipbubble.data?.isConfigured && shipbubble.data.settings.isActive) },
    { title: 'Payments and KYC', text: 'Verify your business to unlock wallet withdrawals.', section: 'Payments & KYC', icon: 'shield', done: Boolean(kyc.data && kyc.data.tier > 0) },
  ]
  const completed = steps.filter(step => step.done).length

  return {
    steps,
    completed,
    total: steps.length,
    percent: (completed / steps.length) * 100,
    isLoading: settings.isLoading || shipbubble.isLoading || kyc.isLoading,
    nextSection: steps.find(step => !step.done)?.section ?? 'Storefront',
  }
}
