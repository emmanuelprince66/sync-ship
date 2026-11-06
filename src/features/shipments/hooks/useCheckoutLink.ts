import { getStoreUrl, useStorefrontProfile } from '@/api/storefront-settings'
import type { PackageItem } from '@/api/types'

/**
 * The link a customer opens to buy and pay, on the business's storefront
 * (store_front app). Sync360 has no "pay this order" link endpoint: the customer's
 * storefront checkout (order/outstore-checkout) creates the order itself, with their
 * address, courier and payment. Same URL rules as sink-inventory's getStoreUrl:
 *  · approved custom domain → https://{domain}/out[/product/{id}]
 *  · otherwise              → https://store.sync360.africa/o/{store_url}[/product/{id}]
 * One product deep-links to its page; several open the store to add them.
 */
export function useCheckoutLink() {
  const profileQuery = useStorefrontProfile()
  const profile = profileQuery.data
  const hasStore = Boolean(profile && (profile.storeSlug.trim() || (profile.customDomainApproved && profile.customDomain.trim())))

  const buildLink = (products: PackageItem[]) => {
    if (!profile || !hasStore) return null
    const base = getStoreUrl(profile, 'OUTSTORE')
    const productIds = [...new Set(products.map(product => product.productId).filter(Boolean))]
    return productIds.length === 1 ? `${base}/product/${productIds[0]}` : base
  }

  return { buildLink, hasStore, isLoading: profileQuery.isLoading, storeName: profile?.name ?? '' }
}

/** Share text for WhatsApp / the native share sheet. */
export const checkoutMessage = (storeName: string, products: PackageItem[], link: string) => {
  const names = products.map(product => `${Number(product.quantity) > 1 ? `${product.quantity} × ` : ''}${product.name}`).join(', ')
  return `Hi! Here’s your checkout link${storeName ? ` from ${storeName}` : ''} for ${names}. Add your delivery address, choose a delivery option and pay securely: ${link}`
}
