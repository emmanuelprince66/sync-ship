import { Icon } from '@/components/ui/Icon'
import { AutomatedShipping } from './components/shipping/AutomatedShipping'
import { ShippingMethodsCard } from './components/shipping/ShippingMethodsCard'
import { SectionHeading } from './shared'

/**
 * Settings › Shipping setup — sink-inventory's ShippingTab ("Automated Shipping") plus its
 * Shipping methods page. Everything saves itself (toggle, Configure, each method), so there is
 * no section-wide Save button — same as sink-inventory.
 */
export function ShippingSection() {
  return <>
    <SectionHeading title="Shipping setup" description="Connect a delivery partner for live rates, and add your own shipping methods."/>
    <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-[#CFE4CD] bg-[#F1F8EF] px-4 py-3">
      <span className="mt-0.5 shrink-0 text-[#438352]"><Icon name="card" size={16}/></span>
      <p className="text-xs leading-5 text-[#214A31]">Automated shipping works with online payment methods only.</p>
    </div>
    <div className="mt-5"><AutomatedShipping/></div>
    <div className="mt-5"><ShippingMethodsCard/></div>
  </>
}
