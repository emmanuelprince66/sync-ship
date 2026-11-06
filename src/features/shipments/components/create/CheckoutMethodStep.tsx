import type { CheckoutMethod } from '@/api/types'
import { Field } from '@/components/ui/Field'
import { Icon, type IconName } from '@/components/ui/Icon'
import { SelectField } from '@/components/ui/SelectField'
import { cn } from '@/lib/cn'
import { formatNaira } from '@/lib/format'
import type { CreateShipmentWizard } from '../../hooks/useCreateShipmentWizard'

const options: { id: CheckoutMethod; icon: IconName; title: string; text: string; meta: string }[] = [
  { id: 'merchant', icon: 'user', title: 'Checkout for my customer', text: 'Enter the customer’s address, select a delivery partner, and pay only the delivery fee.', meta: 'Pay by wallet or checkout' },
  { id: 'customer', icon: 'link', title: 'Send customer a link', text: 'Your customer enters their address, picks a delivery option, and pays for the products and delivery.', meta: 'Customer pays the full total' },
]

export function CheckoutMethodStep({ wizard }: { wizard: CreateShipmentWizard }) {
  const { method, setMethod, register, errors, total, stateOptions, customerLinkAvailable, pickup } = wizard
  return <div>
    <div className="mb-6"><div className="text-lg font-black text-[#0F3124]">Who will complete checkout?</div><div className="mt-1 text-xs text-[#7E8E86]">Choose how you want to confirm the address and delivery payment.</div></div>
    <div className="grid gap-4 md:grid-cols-2" role="radiogroup" aria-label="Checkout method">
      {options.map(item => {
        const unavailable = item.id === 'customer' && !customerLinkAvailable
        return <button type="button" role="radio" aria-checked={method === item.id} aria-disabled={unavailable || undefined} key={item.id} onClick={() => setMethod(item.id)} className={cn('relative rounded-2xl border-2 p-5 text-left transition', method === item.id ? 'border-[#529661] bg-[#F3F9F2]' : 'border-[#E0E8E3] hover:border-[#BDD4C3]', unavailable && 'cursor-not-allowed opacity-60 hover:border-[#E0E8E3]')}>
        {unavailable && <span className="absolute right-4 top-4 rounded-full bg-[#FFF4D9] px-2 py-0.5 text-[9px] font-extrabold text-[#A16A15]">Coming soon</span>}
        {method === item.id && <span className="absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full bg-[#529661] text-white"><Icon name="check" size={12} stroke={2.5}/></span>}
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', method === item.id ? 'bg-[#DDEFD9] text-[#3E7F4D]' : 'bg-[#F0F4F1] text-[#64776D]')}><Icon name={item.icon} size={21}/></div>
        <div className="mt-4 text-sm font-extrabold text-[#17382C]">{item.title}</div><div className="mt-2 text-xs leading-5 text-[#71837A]">{item.text}</div><div className="mt-4 flex items-center gap-1.5 text-[10px] font-extrabold text-[#477952]"><Icon name="card" size={14}/>{item.meta}</div>
      </button>
      })}
    </div>
    {method === 'merchant' && <div className="mt-6 rounded-2xl border border-[#DDE7E1] bg-[#FAFCFA] p-5">
      <div className="mb-4 flex items-center gap-2 text-sm font-extrabold text-[#17382C]"><Icon name="location" size={18}/>Customer delivery details</div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Customer name" autoComplete="name" error={errors.customer?.name?.message} {...register('customer.name')}/>
        <Field label="Phone number" type="tel" autoComplete="tel" error={errors.customer?.phone?.message} {...register('customer.phone')}/>
        <div className="md:col-span-2"><Field label="Email address" type="email" autoComplete="email" placeholder="customer@email.com" hint="Delivery partners send tracking updates here" error={errors.customer?.email?.message} {...register('customer.email')}/></div>
        <div className="md:col-span-2"><Field label="Delivery address" autoComplete="street-address" error={errors.customer?.address?.message} {...register('customer.address')}/></div>
        <Field label="City (optional)" autoComplete="address-level2" placeholder="e.g. Lekki" {...register('customer.city')}/>
        <SelectField label="State" autoComplete="address-level1" options={stateOptions} {...register('customer.state')}/>
      </div>
      <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#EAF5E9] p-3 text-[11px] leading-5 text-[#52705B]"><Icon name="building" size={16}/><span>Pickup address: <strong className="text-[#294C37]">{pickup.full}</strong> — from your business settings.</span></div>
    </div>}
    {method === 'customer' && <div className="mt-6 rounded-2xl bg-[#F0F6EF] p-5"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#438352]"><Icon name="link" size={19}/></div><div><div className="text-xs font-extrabold text-[#234A31]">A unique checkout page will be created</div><div className="mt-1 text-[11px] text-[#708276]">Your customer will pay {formatNaira(total)} for the products plus their selected delivery fee.</div></div></div></div>}
  </div>
}
