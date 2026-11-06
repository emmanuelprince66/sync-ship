import { useState } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { bnplErrorMessage, useSaveStorefront, useSetBnpl, type StorefrontProfile } from '@/api/storefront-settings'
import { useDisclosure } from '@/hooks/useDisclosure'

/**
 * Checkout options from sink-inventory's general settings:
 * BNPL (Akawopay, needs an activated, KYC-upgraded wallet; the backend says why
 * when it refuses) and selling beyond recorded stock.
 */
export function useCheckoutOptions(profile: StorefrontProfile) {
  const bnpl = useSetBnpl()
  const stock = useSaveStorefront()
  const terms = useDisclosure()
  const [agreed, setAgreed] = useState(false)

  const setBnpl = (enabled: boolean) =>
    bnpl.mutate(enabled, {
      onSuccess: () => { toast.success(enabled ? 'BNPL is now available to your customers' : 'BNPL turned off'); terms.close(); setAgreed(false) },
      onError: error => toast.error(bnplErrorMessage(error)),
    })

  return {
    bnplEnabled: profile.enableBnpl,
    /** Turning BNPL on goes through the merchant terms first; turning it off is immediate. */
    toggleBnpl: (next: boolean) => (next ? terms.open() : setBnpl(false)),
    bnplSaving: bnpl.isPending,
    terms: {
      open: terms.isOpen,
      close: () => { terms.close(); setAgreed(false) },
      agreed,
      setAgreed,
      activate: () => setBnpl(true),
    },
    sellWithoutStock: profile.allowSalesWithoutStock,
    setSellWithoutStock: (allowSalesWithoutStock: boolean) =>
      stock.mutate({ allowSalesWithoutStock }, {
        onSuccess: () => toast.success(allowSalesWithoutStock ? 'Customers can now order beyond your stock' : 'Orders are now limited to your stock'),
        onError: error => toast.error(errorMessage(error)),
      }),
    stockSaving: stock.isPending,
  }
}
