import { Button } from '@/components/ui/Button'
import { SuccessIcon } from '@/components/ui/common'
import { Icon } from '@/components/ui/Icon'
import { formatNaira } from '@/lib/format'
import type { CreateShipmentWizard } from '../../hooks/useCreateShipmentWizard'

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <div className="flex justify-between gap-3 text-xs"><span className={strong ? 'font-bold text-[#547064]' : 'text-[#7D8D85]'}>{label}</span><span className={strong ? 'font-black text-[#193C2E]' : 'font-extrabold text-[#193C2E]'}>{value}</span></div>
}

function CheckoutLinkCard({ wizard }: { wizard: CreateShipmentWizard }) {
  const { checkoutLink, copied, copyLink, shareOnWhatsApp, canNativeShare, nativeShare, openLink } = wizard
  if (!checkoutLink) return null
  return <div className="mt-7 text-left">
    <div className="flex items-center gap-2 rounded-xl border border-[#DCE6E0] bg-[#F8FAF8] p-2 pl-4"><Icon name="link" size={17}/><div className="min-w-0 flex-1 truncate text-xs font-bold text-[#345044]" title={checkoutLink}>{checkoutLink}</div><Button variant={copied ? 'secondary' : 'primary'} icon={copied ? 'check' : 'copy'} onClick={copyLink} className="shrink-0 py-2">{copied ? 'Copied' : 'Copy'}</Button></div>
    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
      <button type="button" onClick={shareOnWhatsApp} className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-3 py-2.5 text-xs font-extrabold text-white transition hover:bg-[#1FB959]">WhatsApp</button>
      {canNativeShare && <button type="button" onClick={nativeShare} className="flex items-center justify-center gap-2 rounded-xl border border-[#DCE7E0] bg-white px-3 py-2.5 text-xs font-extrabold text-[#29483B] hover:border-[#529661]"><Icon name="arrow" size={14}/>Share</button>}
      <button type="button" onClick={openLink} className="flex items-center justify-center gap-2 rounded-xl border border-[#DCE7E0] bg-white px-3 py-2.5 text-xs font-extrabold text-[#29483B] hover:border-[#529661]"><Icon name="route" size={14}/>Open link</button>
    </div>
  </div>
}

export function ShipmentSuccess({ wizard }: { wizard: CreateShipmentWizard }) {
  const { isMerchant, partner, deliveryMode, products, total, deliveryFee, orderTotal, amountPaid, payment, result, close, trackShipment } = wizard
  const booked = deliveryMode === 'shipbubble'
  const message = isMerchant
    ? booked
      ? `${partner?.full ?? 'Your delivery partner'} has been booked. A rider will come to your pickup address — track progress in Shipping & tracking.`
      : `The order is saved with ${partner?.full ?? 'your delivery rate'}. Update its status in Shipping & tracking as you deliver it.`
    : 'Share this link with your customer. They’ll add their address, choose a delivery option and pay online — the order shows up in Shipping & tracking once they pay.'
  return <div className="min-h-screen bg-[#F7F9F7] p-4 sm:p-5 md:p-10">
    <div className="mx-auto max-w-xl rounded-3xl border border-[#DFE8E2] bg-white p-6 text-center shadow-[0_22px_70px_rgba(9,38,28,.08)] sm:p-8 md:p-12">
      <SuccessIcon/>
      <h1 className="mt-6 text-2xl font-black text-[#09261C]">{isMerchant ? (booked ? 'Order created & rider booked' : 'Order created') : 'Checkout link is ready'}</h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#73857C]">{message}</p>
      {!isMerchant && <CheckoutLinkCard wizard={wizard}/>}
      <div className="mt-7 space-y-3 rounded-2xl bg-[#F2F7F3] p-5 text-left">
        {isMerchant && result && <><Row label="Order" value={result.shipment.id}/><div className="border-t border-[#DEE8E1]"/></>}
        <Row label="Items" value={`${products.length} ${products.length === 1 ? 'item' : 'items'}`}/>
        <div className="border-t border-[#DEE8E1]"/>
        <Row label="Products" value={formatNaira(total)}/>
        <Row label="Delivery" value={isMerchant ? formatNaira(deliveryFee) : 'Chosen at checkout'}/>
        <div className="border-t border-[#DEE8E1]"/>
        {isMerchant
          ? <Row strong label={payment.status === 'UNPAID' ? 'Customer owes' : payment.status === 'PAID' ? 'Customer paid' : 'Paid so far'} value={formatNaira(payment.status === 'UNPAID' ? orderTotal : amountPaid)}/>
          : <Row strong label="Customer pays" value={`${formatNaira(total)} + delivery`}/>}
      </div>
      <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2"><Button variant="outline" onClick={close}>Back to dashboard</Button><Button icon="truck" onClick={trackShipment}>{isMerchant ? 'Track shipment' : 'View shipments'}</Button></div>
    </div>
  </div>
}
