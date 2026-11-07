import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Logo } from '@/components/ui/Logo'
import { CheckoutMethodStep } from './components/create/CheckoutMethodStep'
import { DeliveryRateStep } from './components/create/DeliveryRateStep'
import { PackageStep } from './components/create/PackageStep'
import { ReviewStep } from './components/create/ReviewStep'
import { ShipmentSuccess } from './components/create/ShipmentSuccess'
import { Stepper } from './components/create/Stepper'
import { useCreateShipmentWizard } from './hooks/useCreateShipmentWizard'

export default function CreateShipmentPage() {
  const wizard = useCreateShipmentWizard()
  const { step } = wizard

  if (step === 5) return <ShipmentSuccess wizard={wizard}/>

  return <div className="min-h-screen bg-[#F7F9F7]">
    <header className="flex h-[72px] items-center justify-between gap-3 border-b border-[#E3EAE6] bg-white px-4 md:px-8"><div className="flex min-w-0 items-center gap-3"><button type="button" onClick={wizard.back} aria-label={wizard.step === 1 ? 'Back to dashboard' : 'Previous step'} className="flex h-9 items-center gap-1.5 rounded-xl border border-[#E0E8E3] px-2.5 text-xs font-extrabold text-[#34483F] hover:bg-[#F3F7F4]"><span className="rotate-180"><Icon name="arrow" size={15}/></span>Back</button><span className="hidden sm:block"><Logo/></span></div><button type="button" aria-label="Close" onClick={wizard.close} className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E0E8E3] text-[#667870] hover:bg-[#F3F7F4]"><Icon name="close" size={18}/></button></header>
    <main className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-10">
      <div className="mb-7 text-center"><h1 className="text-xl font-black text-[#09261C]">Create a new shipment</h1><div className="mt-1 text-xs text-[#7F8F87]">Book delivery in just a few simple steps</div></div>
      <Stepper step={step}/>
      <form noValidate onSubmit={event => { event.preventDefault(); wizard.next() }} className="rounded-3xl border border-[#E0E8E3] bg-white p-5 shadow-[0_15px_45px_rgba(17,49,37,.04)] md:p-8">
        {step === 1 && <PackageStep wizard={wizard}/>}
        {step === 2 && <CheckoutMethodStep wizard={wizard}/>}
        {step === 3 && <DeliveryRateStep wizard={wizard}/>}
        {step === 4 && <ReviewStep wizard={wizard}/>}
        <div className="mt-8 flex items-center justify-between border-t border-[#EDF1EF] pt-5"><Button variant="ghost" onClick={wizard.back}>{wizard.backLabel}</Button><Button type="submit" loading={wizard.isSubmitting} disabled={!wizard.canContinue} icon={wizard.primaryIcon}>{wizard.primaryLabel}</Button></div>
      </form>
    </main>
  </div>
}
