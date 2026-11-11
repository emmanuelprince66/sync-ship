import { useState, type KeyboardEvent } from 'react'
import { apiErrorText } from '@/api/http'
import { useSkuLookup, type SkuProduct } from '@/api/items'

export type SkuStatus =
  | { kind: 'idle' }
  | { kind: 'found'; product: SkuProduct; filled: string[] }
  | { kind: 'notFound'; sku: string }
  | { kind: 'error'; message: string }

/**
 * "Load from SKU / barcode": looks the code up (GET product/sku/?sku=) and hands the
 * product to `onFound`, which fills the form. A miss is a normal outcome, not an error.
 */
export function useSkuPrefill(onFound: (product: SkuProduct) => Promise<string[]> | string[]) {
  const lookup = useSkuLookup()
  const [sku, setSku] = useState('')
  const [status, setStatus] = useState<SkuStatus>({ kind: 'idle' })

  const load = async () => {
    const code = sku.trim()
    if (!code || lookup.isPending) return
    try {
      const product = await lookup.mutateAsync(code)
      if (!product) { setStatus({ kind: 'notFound', sku: code }); return }
      setStatus({ kind: 'found', product, filled: await onFound(product) })
    } catch (error) {
      setStatus({ kind: 'error', message: apiErrorText(error, 'We couldn’t look that SKU up. Check your connection and try again.') })
    }
  }

  return {
    sku,
    setSku: (value: string) => { setSku(value); if (status.kind !== 'idle') setStatus({ kind: 'idle' }) },
    load,
    /** Enter in the SKU box loads instead of submitting the item form. */
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => { if (event.key === 'Enter') { event.preventDefault(); void load() } },
    isLoading: lookup.isPending,
    status,
    reset: () => { setSku(''); setStatus({ kind: 'idle' }) },
  }
}
