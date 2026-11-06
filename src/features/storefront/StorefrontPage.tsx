import { MediaCardGridSkeleton, Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import { DeliveryView } from './DeliveryView'
import { useStorefrontCheckout } from './hooks/useStorefrontCheckout'
import { OrderSuccess } from './OrderSuccess'
import { ShopView } from './ShopView'
import { StorefrontHeader } from './StorefrontHeader'

/** Full-screen preview of the merchant's public storefront. */
export default function StorefrontPage() {
  const checkout = useStorefrontCheckout()

  if (checkout.isLoading) return <div className="min-h-screen bg-[#F8FAF8]">
    <StorefrontHeader count={0} onBack={checkout.exit} onOpenCart={checkout.openCart}/>
    <SkeletonGroup label="Loading store" className="mx-auto max-w-6xl px-5 py-8 md:py-12">
      <Skeleton className="h-56 w-full rounded-3xl"/>
      <div className="mt-10 flex items-end justify-between"><div className="space-y-2"><Skeleton className="h-5 w-36"/><Skeleton className="h-3 w-28"/></div><Skeleton className="h-10 w-40 rounded-xl"/></div>
      <MediaCardGridSkeleton count={3} imageClassName="h-64" rounded="rounded-3xl" className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"/>
    </SkeletonGroup>
  </div>
  if (checkout.stage === 'success') return <OrderSuccess storeName={checkout.storeName} rate={checkout.rate} orderNumber={checkout.orderNumber} total={checkout.total} onDone={checkout.exit}/>

  return <div className="min-h-screen bg-[#F8FAF8]">
    <StorefrontHeader count={checkout.cart.count} onBack={checkout.exit} onOpenCart={checkout.openCart}/>
    {checkout.stage === 'shop'
      ? <ShopView storeName={checkout.storeName} search={checkout.search} setSearch={checkout.setSearch} availableCount={checkout.availableCount} visibleProducts={checkout.visibleProducts} cart={checkout.cart}/>
      : <DeliveryView register={checkout.register} errors={checkout.errors} pay={checkout.pay} rateOptions={checkout.rateOptions} selectedRateId={checkout.selectedRateId} selectRate={checkout.selectRate} cart={checkout.cart} deliveryFee={checkout.deliveryFee} total={checkout.total} continueShopping={checkout.continueShopping} ratesAtCheckout={checkout.ratesAtCheckout}/>}
  </div>
}
