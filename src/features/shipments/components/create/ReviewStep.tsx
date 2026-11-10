import { Field } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { OptionSelect } from '@/components/ui/OptionSelect'
import { cn } from '@/lib/cn'
import { formatNaira } from '@/lib/format'
import { PAYMENT_METHOD_OPTIONS, PAYMENT_STATUS_OPTIONS, type CreateShipmentWizard } from '../../hooks/useCreateShipmentWizard'

function SummaryLine({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <div className={cn('flex justify-between gap-3', strong ? 'text-sm font-black text-[#17382C]' : 'text-[#74857C]')}><span>{label}</span><span className={strong ? '' : 'font-bold text-[#34483F]'}>{value}</span></div>
}

/** What the customer has already paid (sink's payment status / method / bank / amount). */
function PaymentSection({ wizard }: { wizard: CreateShipmentWizard }) {
  const { payment, setPaymentStatus, setPaymentMethod, bankOptions, banksLoading, register, errors } = wizard
  return <div className="rounded-2xl border border-[#E0E8E3] p-5">
    <div className="mb-4 flex items-center gap-2 text-xs font-extrabold text-[#17382C]"><Icon name="card" size={17}/>Customer payment</div>
    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Payment status">
      {PAYMENT_STATUS_OPTIONS.map(option => <button type="button" role="radio" aria-checked={payment.status === option.value} key={option.value} onClick={() => setPaymentStatus(option.value)} className={cn('rounded-xl border p-3 text-left transition', payment.status === option.value ? 'border-[#529661] bg-[#F4FAF3]' : 'border-[#DDE7E1] bg-white hover:border-[#BDD4C3]')}>
        <div className="text-[11px] font-extrabold text-[#29483B]">{option.label}</div><div className="mt-0.5 text-[9px] text-[#87968F]">{option.detail}</div>
      </button>)}
    </div>
    {payment.status !== 'UNPAID' && <div className="mt-4 space-y-4">
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Payment method">
        {PAYMENT_METHOD_OPTIONS.map(option => <button type="button" role="radio" aria-checked={payment.method === option.value} key={option.value} onClick={() => setPaymentMethod(option.value)} className={cn('flex items-center gap-2 rounded-xl border p-3 text-left transition', payment.method === option.value ? 'border-[#529661] bg-[#F4FAF3]' : 'border-[#DDE7E1] bg-white hover:border-[#BDD4C3]')}>
          <Icon name={option.icon} size={15}/><span className="text-[11px] font-extrabold text-[#29483B]">{option.label}</span>
        </button>)}
      </div>
      {payment.method === 'BANK' && <OptionSelect label="Received into" disabled={banksLoading} placeholder={banksLoading ? 'Loading accounts…' : bankOptions.length ? 'Select an account' : 'No settlement accounts yet'} options={bankOptions.map(option => ({ value: String(option.id), label: option.label }))} error={errors.payment?.bankId?.message} {...register('payment.bankId')}/>}
      {payment.status === 'PARTIAL' && <Field label="Amount paid so far" type="number" min={0} inputMode="decimal" suffix="NGN" error={errors.payment?.amountPaid?.message} {...register('payment.amountPaid')}/>}
    </div>}
  </div>
}

export function ReviewStep({ wizard }: { wizard: CreateShipmentWizard }) {
  const { isMerchant, products, customer, partner, total, deliveryFee, orderTotal, amountPaid, balance, payment, needsShippingDate, register, errors, goToStep } = wizard
  return <div>
    <div className="mb-6"><div className="text-lg font-black text-[#0F3124]">Review your {isMerchant ? 'order' : 'checkout link'}</div><div className="mt-1 text-xs text-[#7E8E86]">Confirm the details before {isMerchant ? 'creating the order' : 'creating the checkout link'}.</div></div>
    <div className="grid gap-5 md:grid-cols-[1fr_300px]">
      <div className="min-w-0 space-y-4">
        <div className="rounded-2xl border border-[#E0E8E3] p-5"><div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2 text-xs font-extrabold text-[#17382C]"><Icon name="box" size={17}/>Package details</div><button type="button" onClick={() => goToStep(1)} className="text-[10px] font-extrabold text-[#4A8C58]">Edit</button></div>{products.map((item, index) => <div key={index} className="flex justify-between gap-3 border-t border-[#EDF1EF] py-3 first:border-0"><div className="min-w-0"><div className="truncate text-xs font-bold text-[#34483F]">{item.name}</div><div className="mt-1 text-[10px] text-[#8B9A93]">{item.quantity} item · {item.weight} kg</div></div><div className="shrink-0 text-xs font-extrabold text-[#28483B]">{formatNaira(item.amount)}</div></div>)}</div>
        <div className="rounded-2xl border border-[#E0E8E3] p-5"><div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2 text-xs font-extrabold text-[#17382C]"><Icon name={isMerchant ? 'location' : 'link'} size={17}/>{isMerchant ? 'Delivery details' : 'Customer checkout'}</div><button type="button" onClick={() => goToStep(2)} className="text-[10px] font-extrabold text-[#4A8C58]">Edit</button></div>{isMerchant ? <div className="break-words text-xs leading-6 text-[#66786F]"><strong className="text-[#2C4C3F]">{customer.name}</strong><br/>{customer.phone} · {customer.email}<br/>{[customer.address, customer.city, customer.state].filter(Boolean).join(', ')}</div> : <div className="text-xs leading-5 text-[#66786F]">Your customer opens your store, adds their delivery address, chooses a delivery option and pays online. The order is created when they pay.</div>}</div>
        {isMerchant && <PaymentSection wizard={wizard}/>}
        {isMerchant && <div className="grid gap-4 sm:grid-cols-2">
          {needsShippingDate && <Field label="Shipping date" type="date" error={errors.shippingDate?.message} {...register('shippingDate')}/>}
          <div className={needsShippingDate ? '' : 'sm:col-span-2'}><Field label="Note (optional)" placeholder="e.g. Call before delivery" {...register('note')}/></div>
        </div>}
      </div>
      <div className="h-fit rounded-2xl bg-[#F2F7F3] p-5">
        <div className="text-xs font-extrabold text-[#17382C]">{isMerchant ? 'Order summary' : 'Payment summary'}</div>
        <div className="mt-5 space-y-3 text-xs">
          <SummaryLine label="Products" value={formatNaira(total)}/>
          <SummaryLine label="Delivery" value={isMerchant ? formatNaira(deliveryFee) : 'Chosen at checkout'}/>
          <div className="border-t border-[#D9E4DC] pt-3"><SummaryLine strong label={isMerchant ? 'Order total' : 'Customer pays'} value={isMerchant ? formatNaira(orderTotal) : `${formatNaira(total)} + delivery`}/></div>
          {isMerchant && payment.status !== 'UNPAID' && <><SummaryLine label="Paid" value={formatNaira(amountPaid)}/><SummaryLine label="Balance" value={formatNaira(balance)}/></>}
        </div>
        {isMerchant && partner && <div className="mt-5 rounded-xl bg-white p-3"><div className="flex items-center gap-2">{partner.image ? <img src={partner.image} alt="" className="h-8 w-8 rounded-lg border border-[#E4EBE7] object-contain p-0.5"/> : <div className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black text-white" style={{ backgroundColor: partner.color }}>{partner.initials}</div>}<div className="min-w-0"><div className="truncate text-[11px] font-extrabold text-[#29483B]">{partner.full}</div><div className="truncate text-[9px] text-[#8B9992]">{partner.eta}</div></div></div></div>}
      </div>
    </div>
  </div>
}
