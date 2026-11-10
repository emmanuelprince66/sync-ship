import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { isLive } from '@/api/http'
import { useItems } from '@/api/items'
import { useBusinessSettings } from '@/api/settings'
import { useDeliveryPartners } from '@/api/shipments'
import { paths } from '@/routes/paths'
import { deliveryDefaults, deliverySchema, type DeliveryValues } from '../schemas'
import { useCart } from './useCart'

export type StorefrontStage = 'shop' | 'delivery' | 'success'

const generateOrderNumber = () => `KS-${Math.floor(10000 + Math.random() * 90000)}`

/** Drives the public storefront preview: product search, cart, delivery rate, and checkout. */
export function useStorefrontCheckout() {
  const navigate = useNavigate()
  const { data: items = [], isLoading } = useItems()
  const { data: settings } = useBusinessSettings()
  const { data: partners = [] } = useDeliveryPartners()
  const [stage, setStage] = useState<StorefrontStage>('shop')
  const [search, setSearch] = useState('')
  const [selectedRateId, setSelectedRateId] = useState(1)
  const [orderNumber, setOrderNumber] = useState('')

  const available = items.filter(item => item.inStock && item.listed !== false)
  const cart = useCart(available)
  const query = search.trim().toLowerCase()
  const visibleProducts = query ? available.filter(item => item.name.toLowerCase().includes(query)) : available

  const rateOptions = partners.slice(0, 3)
  const rate = partners.find(partner => partner.id === selectedRateId) ?? partners[0]
  const deliveryFee = rate?.price ?? 0

  const { register, handleSubmit, formState: { errors } } = useForm<DeliveryValues>({
    resolver: zodResolver(deliverySchema),
    defaultValues: deliveryDefaults,
  })

  const openCart = () => { if (cart.count > 0) setStage('delivery') }
  const continueShopping = () => setStage('shop')
  const storeUrl = settings?.storeUrl ?? ''
  /**
   * This page is the merchant's preview. Live orders are placed on the real
   * storefront, so live mode hands off there instead of faking a payment.
   */
  const pay = handleSubmit(() => {
    if (isLive()) {
      if (storeUrl) window.open(storeUrl.startsWith('http') ? storeUrl : `https://${storeUrl}`, '_blank', 'noopener')
      else toast.info('Customers pay on your live storefront. Set it up in Settings › Storefront.')
      return
    }
    setOrderNumber(generateOrderNumber())
    setStage('success')
  })
  const exit = () => navigate(paths.items)

  return {
    isLoading,
    stage,
    storeName: settings?.storefront.name ?? 'Our store',
    search,
    setSearch,
    availableCount: available.length,
    visibleProducts,
    cart,
    rateOptions,
    /** Live: delivery is quoted on the real storefront at checkout, so no options are listed here. */
    ratesAtCheckout: isLive(),
    rate,
    selectedRateId,
    selectRate: setSelectedRateId,
    deliveryFee,
    total: cart.subtotal + deliveryFee,
    register,
    errors,
    orderNumber,
    openCart,
    continueShopping,
    pay,
    exit,
  }
}

export type StorefrontCheckout = ReturnType<typeof useStorefrontCheckout>
