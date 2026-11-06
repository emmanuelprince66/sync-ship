import { useSetShipbubbleActive, useShipbubbleSettings } from '@/api/shipping-settings'
import { useDisclosure } from '@/hooks/useDisclosure'

/**
 * Settings › Shipping setup › Logistics Integrations — sink-inventory's AutomatedShipping.
 *
 * The Activate/Deactivate control is the backend flag `shipbubble_settings.is_active`:
 *  - OFF → confirm first (it turns off live rates at checkout) → PATCH is_active=false
 *  - ON + not configured → terms first → then the Configure modal (a complete payload is
 *    needed to activate; saving it also turns is_active on)
 *  - ON + configured → PATCH is_active=true straight away
 */
export const useAutomatedShipping = () => {
  const shipbubble = useShipbubbleSettings()
  const setActive = useSetShipbubbleActive()
  const settingsModal = useDisclosure()
  const agreement = useDisclosure()
  const deactivate = useDisclosure()

  const isConfigured = Boolean(shipbubble.data?.isConfigured)
  const isActive = Boolean(shipbubble.data?.settings.isActive)

  const toggle = (next: boolean) => {
    if (!next) return deactivate.open()
    if (!isConfigured) return agreement.open()
    setActive.mutate(true)
  }

  const acceptAgreement = () => {
    agreement.close()
    if (isConfigured) setActive.mutate(true)
    else settingsModal.open()
  }

  const confirmDeactivate = () => setActive.mutate(false, { onSuccess: deactivate.close })

  return {
    isLoading: shipbubble.isLoading,
    saved: shipbubble.data,
    isConfigured,
    isActive,
    saving: setActive.isPending,
    toggle,
    settingsModal,
    agreement: { isOpen: agreement.isOpen, close: agreement.close, accept: acceptAgreement },
    deactivate: { isOpen: deactivate.isOpen, close: deactivate.close, confirm: confirmDeactivate },
    openHelp: () => window.open('https://shipbubble.com', '_blank', 'noopener,noreferrer'),
  }
}
