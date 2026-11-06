import type { DeliveryPartner } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { SuccessIcon } from '@/components/ui/common'
import { formatNaira } from '@/lib/format'

type OrderSuccessProps = { storeName: string; rate: DeliveryPartner | undefined; orderNumber: string; total: number; onDone: () => void }

export function OrderSuccess({ storeName, rate, orderNumber, total, onDone }: OrderSuccessProps) {
  return <div className="min-h-screen bg-[#F5F7F4] p-5 md:p-10">
    <div className="mx-auto max-w-xl rounded-3xl border border-[#DFE8E2] bg-white p-10 text-center shadow-[0_20px_60px_rgba(9,38,28,.08)]">
      <SuccessIcon/>
      <div className="mt-6 text-2xl font-black text-[#17382C]">Your order is confirmed</div>
      <div className="mt-2 text-sm leading-6 text-[#75877E]">{storeName} has received your order.{rate && ` ${rate.full} will deliver it within ${rate.eta}.`}</div>
      <div className="mt-6 rounded-2xl bg-[#F2F7F3] p-5 text-left text-xs">
        <div className="flex justify-between"><span className="text-[#718279]">Order number</span><span className="font-extrabold text-[#28483B]">{orderNumber}</span></div>
        <div className="my-3 border-t border-[#DDE7E1]"/>
        <div className="flex justify-between"><span className="text-[#718279]">Amount paid</span><span className="font-black text-[#28483B]">{formatNaira(total)}</span></div>
      </div>
      <Button onClick={onDone} className="mt-6">Done</Button>
    </div>
  </div>
}
