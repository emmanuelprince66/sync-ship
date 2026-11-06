import { Button } from '@/components/ui/Button'
import { Icon, type IconName } from '@/components/ui/Icon'
import { ListSkeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { formatNaira } from '@/lib/format'
import type { CreateShipmentWizard } from '../../hooks/useCreateShipmentWizard'

function RatesMessage({ title, text, action, onAction, icon = 'route' }: { title: string; text: string; action: string; onAction: () => void; icon?: IconName }) {
  return <div role="alert" className="flex flex-col items-center rounded-2xl border border-dashed border-[#E8C8C3] bg-[#FFF8F6] px-6 py-10 text-center">
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#C2413A]"><Icon name="truck" size={21}/></div>
    <div className="mt-4 text-sm font-extrabold text-[#17382C]">{title}</div>
    <div className="mt-1.5 max-w-xs text-xs leading-5 text-[#7D8E85]">{text}</div>
    <Button variant="outline" icon={icon} onClick={onAction} className="mt-5">{action}</Button>
  </div>
}

/** Customer-link flow: delivery is chosen by the customer on the storefront, so explain what they'll see. */
function CustomerDeliveryInfo({ wizard }: { wizard: CreateShipmentWizard }) {
  const { deliveryMode, rates, ratesLoading } = wizard
  return <div className="space-y-4">
    <div className="flex items-start gap-3 rounded-2xl bg-[#F0F6EF] p-5"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#438352]"><Icon name="route" size={19}/></div><div><div className="text-xs font-extrabold text-[#234A31]">{deliveryMode === 'shipbubble' ? 'Live courier rates at checkout' : 'Your delivery rates at checkout'}</div><div className="mt-1 text-[11px] leading-5 text-[#708276]">{deliveryMode === 'shipbubble' ? 'After your customer enters their address, your store shows live rates from verified delivery partners and they choose one.' : 'Your customer picks one of the delivery rates you’ve set up in Settings › Shipping setup.'}</div></div></div>
    {deliveryMode !== 'shipbubble' && (ratesLoading
      ? <ListSkeleton rows={2} className="space-y-3" rowClassName="flex items-center gap-3 rounded-2xl border border-[#E4EBE7] p-4"/>
      : rates.length > 0 && <div className="space-y-2">{rates.map(rate => <div key={rate.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[#E4EBE7] p-4"><div className="min-w-0"><div className="truncate text-xs font-extrabold text-[#17382C]">{rate.full}</div><div className="mt-0.5 truncate text-[10px] text-[#819088]">{rate.eta}</div></div><div className="shrink-0 text-xs font-black text-[#123528]">{rate.tag || formatNaira(rate.price)}</div></div>)}</div>)}
  </div>
}

export function DeliveryRateStep({ wizard }: { wizard: CreateShipmentWizard }) {
  const { isMerchant, deliveryMode, rates, ratesLoading, ratesError, refreshRates, partnerId, selectPartner, dropoffLabel, pickup, goToShippingSettings, goToStep } = wizard
  const subtitle = !isMerchant ? 'Your customer chooses delivery when they check out.' : deliveryMode === 'shipbubble' ? 'Live rates from verified partners for this route.' : deliveryMode === 'inhouse' ? 'Your own delivery rates from Settings › Shipping setup.' : 'Estimated rates from verified partners for this route.'
  return <div>
    <div className="mb-6 flex items-end justify-between gap-3"><div className="min-w-0"><div className="text-lg font-black text-[#0F3124]">{isMerchant ? 'Choose a delivery option' : 'Customer delivery options'}</div><div className="mt-1 text-xs text-[#7E8E86]">{subtitle}</div></div>
      {isMerchant && <div className="flex shrink-0 items-center gap-3">
        {!ratesLoading && !ratesError && deliveryMode === 'shipbubble' && <div className="hidden items-center gap-1.5 text-[10px] font-bold text-[#75877E] sm:flex"><span className="h-2 w-2 rounded-full bg-[#62A86B]"/>Rates updated now</div>}
        <button type="button" onClick={refreshRates} disabled={ratesLoading} className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-extrabold text-[#438352] hover:bg-[#EAF5E9] disabled:opacity-45"><Icon name="route" size={14}/>Refresh</button>
      </div>}
    </div>
    <div className="mb-5 flex items-start gap-3 rounded-2xl bg-[#F4F8F5] p-4"><Icon name="route" size={19}/><div className="grid min-w-0 flex-1 gap-3 text-xs sm:grid-cols-[1fr_auto_1fr]"><div className="min-w-0"><div className="text-[10px] font-bold uppercase text-[#8A9991]">Pickup</div><div className="mt-1 truncate font-extrabold text-[#28483B]">{pickup.label}</div></div><div className="hidden items-center text-[#9CAC9F] sm:flex"><Icon name="arrow" size={17}/></div><div className="min-w-0"><div className="text-[10px] font-bold uppercase text-[#8A9991]">Drop-off</div><div className="mt-1 truncate font-extrabold text-[#28483B]">{dropoffLabel}</div></div></div></div>
    {!isMerchant
      ? <CustomerDeliveryInfo wizard={wizard}/>
      : ratesLoading
        ? <ListSkeleton rows={4} className="space-y-3" rowClassName="flex min-h-[80px] w-full items-center gap-3 rounded-2xl border-2 border-[#E4EBE7] p-4 sm:gap-4"/>
        : ratesError
          ? <RatesMessage title="We couldn’t load delivery options" text="Check the delivery address and your connection, then try again." action="Try again" onAction={refreshRates}/>
          : rates.length === 0
            ? deliveryMode === 'inhouse'
              ? <RatesMessage title="No delivery rates yet" text="Connect Shipbubble for live courier rates, or add your own delivery rates in Shipping setup." action="Open shipping setup" icon="settings" onAction={goToShippingSettings}/>
              : <RatesMessage title="No delivery options for this route" text="Check the address or the items, then refresh the rates." action="Edit address" icon="location" onAction={() => goToStep(2)}/>
            : <div className="space-y-3" role="radiogroup" aria-label="Delivery option">{rates.map(item => <button type="button" role="radio" aria-checked={partnerId === item.id} key={item.id} onClick={() => selectPartner(item.id)} className={cn('flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left transition sm:gap-4', partnerId === item.id ? 'border-[#529661] bg-[#F5FAF4]' : 'border-[#E4EBE7] hover:border-[#C4D7C9]')}>
              {item.image
                ? <img src={item.image} alt="" className="h-11 w-11 shrink-0 rounded-xl border border-[#E4EBE7] bg-white object-contain p-1"/>
                : <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white" style={{ backgroundColor: item.color }}>{item.initials}</div>}
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><span className="truncate text-sm font-extrabold text-[#17382C]">{item.name}</span>{item.tag && <span className="rounded-full bg-[#E5F3E2] px-2 py-0.5 text-[9px] font-extrabold text-[#438052]">{item.tag}</span>}</div><div className="mt-1 flex items-center gap-3 text-[10px] text-[#819088]"><span className="flex min-w-0 items-center gap-1"><Icon name="clock" size={12}/><span className="truncate">{item.eta}</span></span>{item.rating && <span className="shrink-0">★ {item.rating}</span>}</div></div>
              <div className="shrink-0 text-right"><div className="text-sm font-black text-[#123528]">{formatNaira(item.price)}</div>{deliveryMode !== 'inhouse' && <div className="mt-1 text-[9px] text-[#91A098]">VAT included</div>}</div>
              <div className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2', partnerId === item.id ? 'border-[#529661] bg-[#529661] text-white' : 'border-[#CAD6CF]')}>{partnerId === item.id && <Icon name="check" size={11} stroke={3}/>}</div>
            </button>)}</div>}
  </div>
}
