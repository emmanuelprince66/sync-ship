import type { PaymentMethod } from '@/api/types'
import { Icon, type IconName } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'
import { formatNaira } from '@/lib/format'
import type { CreateShipmentWizard } from '../../hooks/useCreateShipmentWizard'

export function ReviewStep({ wizard }: { wizard: CreateShipmentWizard }) {
  const { isMerchant, products, customer, partner, total, deliveryFee, payable, paymentMethod, setPaymentMethod, walletBalanceLabel, goToStep } = wizard
  const paymentOptions: { id: PaymentMethod; label: string; detail: string; icon: IconName }[] = [
    { id: 'wallet', label: 'Wallet', detail: walletBalanceLabel, icon: 'wallet' },
    { id: 'checkout', label: 'Checkout', detail: 'Pay now', icon: 'card' },
  ]
  return <div>
    <div className="mb-6"><div className="text-lg font-black text-[#0F3124]">Review your shipment</div><div className="mt-1 text-xs text-[#7E8E86]">Confirm the details before {isMerchant ? 'booking a rider' : 'creating the checkout link'}.</div></div>
    <div className="grid gap-5 md:grid-cols-[1fr_300px]">
      <div className="space-y-4">
        <div className="rounded-2xl border border-[#E0E8E3] p-5"><div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2 text-xs font-extrabold text-[#17382C]"><Icon name="box" size={17}/>Package details</div><button type="button" onClick={() => goToStep(1)} className="text-[10px] font-extrabold text-[#4A8C58]">Edit</button></div>{products.map((item, index) => <div key={index} className="flex justify-between border-t border-[#EDF1EF] py-3 first:border-0"><div><div className="text-xs font-bold text-[#34483F]">{item.name}</div><div className="mt-1 text-[10px] text-[#8B9A93]">{item.quantity} item · {item.weight} kg · {item.length} × {item.width} cm</div></div><div className="text-xs font-extrabold text-[#28483B]">{formatNaira(item.amount)}</div></div>)}</div>
        <div className="rounded-2xl border border-[#E0E8E3] p-5"><div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2 text-xs font-extrabold text-[#17382C]"><Icon name={isMerchant ? 'location' : 'link'} size={17}/>{isMerchant ? 'Delivery details' : 'Customer checkout'}</div><button type="button" onClick={() => goToStep(2)} className="text-[10px] font-extrabold text-[#4A8C58]">Edit</button></div>{isMerchant ? <div className="text-xs leading-6 text-[#66786F]"><strong className="text-[#2C4C3F]">{customer.name}</strong><br/>{customer.phone}<br/>{customer.address}</div> : <div className="text-xs leading-5 text-[#66786F]">Customer will add their delivery address and pay using the secure checkout link.</div>}</div>
      </div>
      <div className="h-fit rounded-2xl bg-[#F2F7F3] p-5">
        <div className="text-xs font-extrabold text-[#17382C]">Payment summary</div>
        <div className="mt-5 space-y-3 text-xs">{!isMerchant && <div className="flex justify-between text-[#74857C]"><span>Products</span><span className="font-bold text-[#34483F]">{formatNaira(total)}</span></div>}<div className="flex justify-between text-[#74857C]"><span>Delivery fee</span><span className="font-bold text-[#34483F]">{formatNaira(deliveryFee)}</span></div><div className="border-t border-[#D9E4DC] pt-3"><div className="flex justify-between text-sm font-black text-[#17382C]"><span>{isMerchant ? 'You pay' : 'Customer pays'}</span><span>{formatNaira(payable)}</span></div></div></div>
        {partner && <div className="mt-5 rounded-xl bg-white p-3"><div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black text-white" style={{ backgroundColor: partner.color }}>{partner.initials}</div><div><div className="text-[11px] font-extrabold text-[#29483B]">{partner.full}</div><div className="text-[9px] text-[#8B9992]">{partner.eta}</div></div></div></div>}
        {isMerchant && <div className="mt-5"><div className="mb-2 text-[10px] font-extrabold uppercase tracking-[.08em] text-[#75877E]">Pay delivery fee with</div><div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Pay delivery fee with">{paymentOptions.map(option => <button type="button" role="radio" aria-checked={paymentMethod === option.id} key={option.id} onClick={() => setPaymentMethod(option.id)} className={cn('rounded-xl border p-3 text-left transition', paymentMethod === option.id ? 'border-[#529661] bg-[#F4FAF3]' : 'border-[#DDE7E1] bg-white')}><div className="flex items-center gap-2"><Icon name={option.icon} size={15}/><span className="text-[10px] font-extrabold text-[#29483B]">{option.label}</span></div><div className="mt-1 text-[9px] text-[#87968F]">{option.detail}</div></button>)}</div></div>}
      </div>
    </div>
  </div>
}
