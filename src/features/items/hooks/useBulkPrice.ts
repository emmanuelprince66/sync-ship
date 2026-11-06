import { useState } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useIncreasePrices } from '@/api/items'
import { formatNaira } from '@/lib/format'

const EXAMPLE_PRICE = 48000

export function useBulkPrice(onClose: () => void) {
  const [priceChange, setPriceChange] = useState('10')
  const increasePrices = useIncreasePrices()
  const percentage = Number(priceChange) || 0

  const apply = () => increasePrices.mutate(percentage, {
    onSuccess: () => { toast.success(`All item prices updated by ${percentage}%`); onClose() },
    onError: error => toast.error(errorMessage(error, 'Could not update prices')),
  })

  return {
    priceChange,
    setPriceChange,
    examplePrice: formatNaira(Math.round(EXAMPLE_PRICE * (1 + percentage / 100))),
    apply,
    isSaving: increasePrices.isPending,
  }
}
