import { Button } from '@/components/ui/Button'
import { SuccessIcon } from '@/components/ui/common'
import { Icon } from '@/components/ui/Icon'
import { formatNaira } from '@/lib/format'
import type { CreateShipmentWizard } from '../../hooks/useCreateShipmentWizard'

export function ShipmentSuccess({ wizard }: { wizard: CreateShipmentWizard }) {
  const { isMerchant, partner, products, total, deliveryFee, payable, result, copied, copyLink, close, trackShipment, previewCheckout } = wizard
  return <div className="min-h-screen bg-[#F7F9F7] p-5 md:p-10">
    <div className="mx-auto max-w-xl rounded-3xl border border-[#DFE8E2] bg-white p-8 text-center shadow-[0_22px_70px_rgba(9,38,28,.08)] md:p-12">
      <SuccessIcon/>
      <h1 className="mt-6 text-2xl font-black text-[#09261C]">{isMerchant ? 'Shipment booked!' : 'Checkout link is ready'}</h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#73857C]">{isMerchant ? `${partner?.full ?? 'Your delivery partner'} has been notified. A rider will arrive at your business address within ${partner?.eta ?? 'a few hours'}.` : 'Share this secure link with your customer. They’ll add their address, choose a delivery partner, and pay online.'}</p>
      {!isMerchant && result?.checkoutLink && <div className="mt-7 flex items-center gap-2 rounded-xl border border-[#DCE6E0] bg-[#F8FAF8] p-2 pl-4 text-left"><Icon name="link" size={17}/><div className="min-w-0 flex-1 truncate text-xs font-bold text-[#345044]">{result.checkoutLink}</div><Button variant={copied ? 'secondary' : 'primary'} icon={copied ? 'check' : 'copy'} onClick={copyLink} className="shrink-0 py-2">{copied ? 'Copied' : 'Copy'}</Button></div>}
      <div className="mt-7 rounded-2xl bg-[#F2F7F3] p-5 text-left">
        <div className="flex justify-between text-xs"><span className="text-[#7D8D85]">Items</span><span className="font-extrabold text-[#193C2E]">{products.length} package item</span></div>
        <div className="my-3 border-t border-[#DEE8E1]"/>
        {!isMerchant && <><div className="flex justify-between text-xs"><span className="text-[#7D8D85]">Products</span><span className="font-extrabold text-[#193C2E]">{formatNaira(total)}</span></div><div className="my-3 border-t border-[#DEE8E1]"/></>}
        <div className="flex justify-between text-xs"><span className="text-[#7D8D85]">Delivery fee</span><span className="font-extrabold text-[#193C2E]">{formatNaira(deliveryFee)}</span></div>
        <div className="my-3 border-t border-[#DEE8E1]"/>
        <div className="flex justify-between text-xs"><span className="font-bold text-[#547064]">{isMerchant ? 'You paid' : 'Customer pays'}</span><span className="font-black text-[#193C2E]">{formatNaira(payable)}</span></div>
      </div>
      <div className="mt-7 grid grid-cols-2 gap-3"><Button variant="outline" onClick={close}>Back to dashboard</Button><Button icon={isMerchant ? 'truck' : 'link'} onClick={isMerchant ? trackShipment : previewCheckout}>{isMerchant ? 'Track shipment' : 'Preview checkout'}</Button></div>
    </div>
  </div>
}
