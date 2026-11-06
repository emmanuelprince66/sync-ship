import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { CardSkeleton, Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import { Toggle } from '@/components/ui/Toggle'
import { cn } from '@/lib/cn'
import { ConfirmDialog } from './components/ConfirmDialog'
import { OptionSelect } from './components/OptionSelect'
import { toOptions } from './options'
import { BoxSizePicker } from './components/shipping/BoxSizePicker'
import { ShipbubbleAgreementModal } from './components/shipping/ShipbubbleAgreementModal'
import { ShippingMethodsCard } from './components/shipping/ShippingMethodsCard'
import { useShippingSection } from './hooks/useShippingSection'
import { SectionHeading } from './shared'

function PickupSkeleton() {
  return <SkeletonGroup label="Loading shipping setup" className="mt-6 space-y-5">
    <Skeleton className="h-[52px] rounded-2xl"/>
    <div className="grid gap-5 md:grid-cols-2">{Array.from({ length: 6 }, (_, index) => <div key={index}><Skeleton className="mb-2 h-3 w-24"/><Skeleton className="h-12 rounded-xl"/></div>)}</div>
    <CardSkeleton lines={2}/>
  </SkeletonGroup>
}

export function ShippingSection() {
  const section = useShippingSection()
  const { form, active } = section
  const { register, formState: { errors, isDirty } } = form

  return <>
    <div className="flex items-start justify-between gap-4">
      <SectionHeading title="Shipping setup" description="Connect delivery partners and set the pickup details used for live rates."/>
      <Toggle label="Shipbubble active" enabled={active} onChange={section.toggleActive}/>
    </div>

    {section.isLoading ? <PickupSkeleton/> : <>
      <div className={cn('mt-6 rounded-2xl p-4', active ? 'bg-[#EDF7EC]' : 'bg-[#FFF7E6]')}>
        <div className={cn('flex items-center gap-2 text-xs font-extrabold', active ? 'text-[#467151]' : 'text-[#8D681D]')}><Icon name={active ? 'check' : 'clock'} size={16}/>{active ? 'Shipping is active — customers see live delivery rates' : section.isConfigured ? 'Shipbubble is off. Turn it on to book riders and show live rates' : 'Complete your pickup details and connect Shipbubble to start booking riders'}</div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className={cn('rounded-2xl border-2 p-4', active ? 'border-[#529661] bg-[#F5FAF4]' : 'border-[#E4EBE7]')}>
          <div className="flex items-start justify-between gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F0FC] text-[#426AB2]"><Icon name="truck" size={19}/></div><span className={cn('rounded-full px-2 py-0.5 text-[9px] font-extrabold', active ? 'bg-[#E4F2E1] text-[#438352]' : 'bg-[#F0F4F1] text-[#6A7C73]')}>{active ? 'Connected' : section.isConfigured ? 'Paused' : 'Not connected'}</span></div>
          <div className="mt-3 text-xs font-extrabold text-[#304B40]">Shipbubble</div>
          <div className="mt-1 text-[10px] leading-4 text-[#8A9891]">Nationwide delivery with 50+ partners and live rates.</div>
        </div>
        <div className="rounded-2xl border-2 border-dashed border-[#E4EBE7] p-4 opacity-80">
          <div className="flex items-start justify-between gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF4D9] text-[#A16A15]"><Icon name="box" size={19}/></div><span className="rounded-full bg-[#F0F4F1] px-2 py-0.5 text-[9px] font-extrabold text-[#6A7C73]">Coming soon</span></div>
          <div className="mt-3 text-xs font-extrabold text-[#304B40]">Chowdeck</div>
          <div className="mt-1 text-[10px] leading-4 text-[#8A9891]">Fast same-day delivery in select cities.</div>
        </div>
      </div>

      <form onSubmit={section.saveSetup} noValidate className="mt-6">
        <div className="mb-4 flex items-center gap-2 text-sm font-extrabold text-[#17382C]"><Icon name="location" size={18}/>Pickup details</div>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Street address" autoComplete="street-address" placeholder="e.g. 22 Awolowo Road" error={errors.street?.message} {...register('street')} className="md:col-span-2"/>
          <Field label="City / area" autoComplete="address-level2" placeholder="e.g. Ikoyi" error={errors.city?.message} {...register('city')}/>
          <OptionSelect label="State" placeholder="Choose a state" options={toOptions(section.states)} error={errors.state?.message} {...register('state')}/>
          <Field label="Pickup phone number" type="tel" autoComplete="tel" error={errors.phone?.message} {...register('phone')}/>
          <Field label="Landmark (optional)" placeholder="e.g. Opposite the filling station" error={errors.landmark?.message} {...register('landmark')}/>
          {section.optionsLoading ? <div><Skeleton className="mb-2 h-3 w-28"/><Skeleton className="h-12 rounded-xl"/></div>
            : <OptionSelect label="What do you usually ship?" placeholder="Choose a category" options={section.categoryOptions} error={errors.categoryId?.message} {...register('categoryId')} className="md:col-span-2"/>}
          <div className="md:col-span-2"><BoxSizePicker sizes={section.boxSizes} selected={section.selectedSize} loading={section.optionsLoading} error={errors.packageSize?.message} onSelect={section.selectSize}/></div>
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#EAF5E9] p-3 text-[11px] leading-5 text-[#52705B]"><Icon name="building" size={16}/><span>Riders come to this address for every shipment, and it’s used to quote live delivery rates.</span></div>
        <div className="mt-6 flex justify-end"><Button type="submit" loading={section.saving} disabled={!isDirty && section.isConfigured}>Save changes</Button></div>
      </form>

      <div className="mt-8"><ShippingMethodsCard/></div>
    </>}

    <ShipbubbleAgreementModal open={section.agreement.isOpen} onClose={section.agreement.close} onAccept={section.agreement.accept} accepting={section.agreement.accepting}/>
    <ConfirmDialog open={section.deactivate.isOpen} tone="default" title="Turn off Shipbubble?" description="Customers will stop seeing live Shipbubble rates at checkout. Your pickup details are kept, so you can turn it back on anytime." confirmLabel="Turn off" loading={section.deactivate.pending} onConfirm={section.deactivate.confirm} onClose={section.deactivate.close}/>
  </>
}
