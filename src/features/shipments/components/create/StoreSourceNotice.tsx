import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import type { CreateShipmentWizard } from '../../hooks/useCreateShipmentWizard'

/**
 * Shown on "Send customer a link" while the store is set to show inventory products:
 * checkout links carry these items, so customers wouldn't find them there.
 */
export function StoreSourceNotice({ wizard, className = '' }: { wizard: CreateShipmentWizard; className?: string }) {
  const { needsSwitch, canSwitch, switching, switchToItems, openItemsPage } = wizard.storeSource
  if (!needsSwitch) return null
  return <div role="note" className={`rounded-2xl border border-[#F0D9A8] bg-[#FFF8E8] p-4 ${className}`}>
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#A16A15]"><Icon name="link" size={17}/></span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-extrabold text-[#6E4F12]">Your store is showing your inventory, not these items</p>
        <p className="mt-1 text-xs leading-5 text-[#80662B]">Checkout links use the items you add here. Switch your store to show these items so your customer can find them and pay. You can change this back any time on the Items page under “Store shows”.</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {canSwitch
            ? <Button onClick={switchToItems} loading={switching} className="h-9 px-4 text-xs">Show these items on my store</Button>
            : <span className="text-xs font-bold text-[#80662B]">Ask your account owner to switch it.</span>}
          <button type="button" onClick={openItemsPage} className="h-9 rounded-xl px-3 text-xs font-extrabold text-[#6E4F12] underline-offset-2 hover:underline">Change it on the Items page</button>
        </div>
      </div>
    </div>
  </div>
}
