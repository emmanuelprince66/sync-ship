import { toast } from 'sonner'
import { apiErrorText } from '@/api/http'
import { useStorefrontSource } from '@/api/items'
import { getStoreUrl, useStorefrontProfile } from '@/api/storefront-settings'
import type { PackageItem } from '@/api/types'

/**
 * The link a customer opens to buy and pay, on the business's storefront
 * (store_front app). Sync360 has no "pay this order" link endpoint: the customer's
 * storefront checkout (order/outstore-checkout) creates the order itself, with their
 * address, courier and payment. The link is a cart deep link the storefront fills
 * the cart from, then opens checkout:
 *  · approved custom domain → https://{domain}/out/checkout?items={id}:{qty},…
 *  · otherwise              → https://store.sync360.africa/o/{store_url}/checkout?items={id}:{qty},…
 * Items are virtual products, which the storefront only serves when the business's
 * storefront_product_source is VIRTUAL ("Store shows: These items"); otherwise the
 * link would find none of them, so no link is made.
 */
export function useCheckoutLink() {
  const profileQuery = useStorefrontProfile()
  const storefront = useStorefrontSource()
  const profile = profileQuery.data
  const hasStore = Boolean(profile && (profile.storeSlug.trim() || (profile.customDomainApproved && profile.customDomain.trim())))
  const servesItems = storefront.source === 'VIRTUAL'

  const showTheseItems = () => storefront.setSource('VIRTUAL', {
    onSuccess: () => toast.success('Your storefront now shows these items.'),
    onError: error => toast.error(apiErrorText(error, 'Could not change what your storefront shows')),
  })

  const buildLink = (products: PackageItem[]) => {
    if (!profile || !hasStore) return null
    // Explained on the page (StoreSourceNotice); no link until the store serves these items.
    if (!servesItems) return null
    const base = getStoreUrl(profile, 'OUTSTORE')
    const quantities = new Map<string, number>()
    for (const product of products) {
      if (!product.productId) continue
      const quantity = Math.max(1, Math.round(Number(product.quantity) || 1))
      quantities.set(product.productId, (quantities.get(product.productId) ?? 0) + quantity)
    }
    // Sample data has no saved product ids: the store itself is the best we can link to.
    if (quantities.size === 0) return base
    const items = [...quantities].map(([id, quantity]) => `${encodeURIComponent(id)}:${quantity}`).join(',')
    return `${base}/checkout?items=${items}`
  }

  return {
    buildLink,
    hasStore,
    /** False when the storefront serves inventory products, so these items can't be bought there. */
    servesItems,
    /** Switches "Store shows" to These items (storefront_product_source = VIRTUAL). */
    showTheseItems,
    switchingSource: storefront.isSaving,
    isLoading: profileQuery.isLoading || storefront.isLoading,
    storeName: profile?.name ?? '',
  }
}

/** Share text for WhatsApp / the native share sheet. */
export const checkoutMessage = (storeName: string, products: PackageItem[], link: string) => {
  const names = products.map(product => `${Number(product.quantity) > 1 ? `${product.quantity} × ` : ''}${product.name}`).join(', ')
  return `Hi! Here’s your checkout link${storeName ? ` from ${storeName}` : ''} for ${names}. Add your delivery address, choose a delivery option and pay securely: ${link}`
}
