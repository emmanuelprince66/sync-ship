import { BackLink } from '@/components/ui/misc'
import { Field } from '@/components/ui/Field'
import { cn } from '@/lib/cn'
import { formatNaira } from '@/lib/format'
import type { StorefrontCheckout } from './hooks/useStorefrontCheckout'
import { OrderSummary } from './OrderSummary'
import { DELIVERY_FORM_ID } from './schemas'

type DeliveryViewProps = Pick<StorefrontCheckout, 'register' | 'errors' | 'pay' | 'rateOptions' | 'selectedRateId' | 'selectRate' | 'cart' | 'deliveryFee' | 'total' | 'continueShopping' | 'ratesAtCheckout'>

export function DeliveryView({ register, errors, pay, rateOptions, selectedRateId, selectRate, cart, deliveryFee, total, continueShopping, ratesAtCheckout }: DeliveryViewProps) {
  return <main className="mx-auto max-w-4xl px-5 py-10">
    <div className="[&>button]:mb-6"><BackLink label="Continue shopping" onClick={continueShopping}/></div>
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <form id={DELIVERY_FORM_ID} onSubmit={pay} noValidate className="rounded-3xl border border-[#E0E8E3] bg-white p-6">
          <div className="text-lg font-black text-[#17382C]">Where should we deliver?</div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Full name" autoComplete="name" error={errors.fullName?.message} {...register('fullName')}/>
            <Field label="Phone number" type="tel" autoComplete="tel" error={errors.phone?.message} {...register('phone')}/>
            <div className="sm:col-span-2"><Field label="Delivery address" autoComplete="street-address" error={errors.address?.message} {...register('address')}/></div>
          </div>
        </form>
        <div className="rounded-3xl border border-[#E0E8E3] bg-white p-6">
          <div className="text-lg font-black text-[#17382C]">Choose delivery</div>
          {rateOptions.length === 0 && <div className="mt-4 rounded-xl bg-[#F4F8F5] p-4 text-[11px] leading-5 text-[#60736A]">{ratesAtCheckout ? 'Live delivery prices are calculated for the customer’s address at checkout on your storefront.' : 'No delivery options yet.'}</div>}
          <div className="mt-4 space-y-3" role="radiogroup" aria-label="Delivery options">{rateOptions.map(partner => <button type="button" role="radio" aria-checked={selectedRateId === partner.id} key={partner.id} onClick={() => selectRate(partner.id)} className={cn('flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left', selectedRateId === partner.id ? 'border-[#529661] bg-[#F5FAF4]' : 'border-[#E2E9E5]')}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-black text-white" style={{ backgroundColor: partner.color }}>{partner.initials}</div>
            <div className="flex-1"><div className="text-xs font-extrabold text-[#28483B]">{partner.full}</div><div className="mt-0.5 text-[9px] text-[#87968F]">{partner.eta}</div></div>
            <div className="text-xs font-black text-[#17382C]">{formatNaira(partner.price)}</div>
          </button>)}</div>
        </div>
      </div>
      <OrderSummary lines={cart.lines} subtotal={cart.subtotal} deliveryFee={deliveryFee} total={total}/>
    </div>
  </main>
}
