import { Button } from '@/components/ui/Button'
import { formatNaira } from '@/lib/format'
import type { CartLine } from './hooks/useCart'
import { DELIVERY_FORM_ID } from './schemas'

type OrderSummaryProps = { lines: CartLine[]; subtotal: number; deliveryFee: number; total: number }

/** Dark summary card. "Pay securely" submits the delivery form by id. */
export function OrderSummary({ lines, subtotal, deliveryFee, total }: OrderSummaryProps) {
  return <div className="h-fit rounded-3xl bg-[#09261C] p-6 text-white">
    <div className="text-sm font-extrabold">Order summary</div>
    <div className="mt-5 space-y-4">{lines.map(line => <div key={line.item.id} className="flex items-center gap-3"><img src={line.item.image} alt="" className="h-10 w-10 rounded-lg object-cover"/><div className="min-w-0 flex-1"><div className="truncate text-[10px] font-bold">{line.item.name}</div><div className="mt-0.5 text-[9px] text-white/50">Qty {line.quantity}</div></div><span className="text-[10px] font-extrabold">{formatNaira(line.total)}</span></div>)}</div>
    <div className="mt-5 space-y-3 border-t border-white/10 pt-5 text-xs">
      <div className="flex justify-between text-white/55"><span>Products</span><span>{formatNaira(subtotal)}</span></div>
      <div className="flex justify-between text-white/55"><span>Delivery</span><span>{formatNaira(deliveryFee)}</span></div>
      <div className="flex justify-between border-t border-white/10 pt-3 text-base font-black"><span>Total</span><span>{formatNaira(total)}</span></div>
    </div>
    <Button type="submit" form={DELIVERY_FORM_ID} variant="secondary" icon="card" className="mt-6 w-full">Pay securely</Button>
  </div>
}
