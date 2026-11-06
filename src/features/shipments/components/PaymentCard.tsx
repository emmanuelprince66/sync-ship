import type { Shipment } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'
import { useUpdatePayment } from '../hooks/useUpdatePayment'

const TONES = { ok: 'bg-[#E4F2E1] text-[#3C7F4C]', warn: 'bg-[#FFF4D9] text-[#A16A15]', due: 'bg-[#FDECEA] text-[#B4483E]' }

function Choice({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return <button type="button" role="radio" aria-checked={active} onClick={onClick} className={cn('rounded-xl border px-3 py-2.5 text-[11px] font-extrabold transition', active ? 'border-[#529661] bg-[#F4FAF3] text-[#29483B]' : 'border-[#DDE7E1] bg-white text-[#5E7168] hover:border-[#BDD4C3]')}>{label}</button>
}

/** Order payment status in the drawer, with sink's "Update payment" form. */
export function PaymentCard({ shipment }: { shipment: Shipment }) {
  const pay = useUpdatePayment(shipment)
  return <div className="rounded-2xl border border-[#E1E9E4] p-5">
    <div className="flex items-center justify-between gap-3">
      <div className="text-xs font-extrabold text-[#17382C]">Payment</div>
      <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-extrabold', TONES[pay.tone])}>{pay.statusLabel}</span>
    </div>
    <div className="mt-3 flex items-center justify-between text-[11px] text-[#7D8D85]"><span>Order total</span><span className="font-extrabold text-[#28483B]">{pay.totalLabel}</span></div>
    {pay.canUpdate && !pay.editing && <Button variant="outline" icon="card" onClick={pay.startEditing} className="mt-4 w-full py-2 text-xs">Update payment</Button>}
    {pay.editing && <form noValidate onSubmit={pay.submit} className="mt-4 space-y-3">
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Payment status"><Choice active={pay.status === 'PAID'} label="Paid in full" onClick={() => pay.setStatus('PAID')}/><Choice active={pay.status === 'PARTIAL'} label="Part paid" onClick={() => pay.setStatus('PARTIAL')}/></div>
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Payment method"><Choice active={pay.method === 'BANK'} label="Bank transfer" onClick={() => pay.setMethod('BANK')}/><Choice active={pay.method === 'CASH'} label="Cash" onClick={() => pay.setMethod('CASH')}/></div>
      {pay.method === 'BANK' && <label className="block">
        <span className="mb-2 block text-[12px] font-extrabold text-[#34483F]">Received into</span>
        <span className={cn('relative flex h-12 items-center rounded-xl border border-[#DCE7E0] bg-white px-3.5', pay.errors.bankId && 'border-[#E65A4F]')}>
          <select className="w-full appearance-none bg-transparent text-sm font-semibold text-[#09261C] outline-none" {...pay.register('bankId')}>
            <option value="">{pay.bankOptions.length ? 'Select an account' : 'No settlement accounts yet'}</option>
            {pay.bankOptions.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
          </select>
          <Icon name="chevron" size={17}/>
        </span>
        {pay.errors.bankId && <span role="alert" className="mt-1.5 block text-[11px] font-semibold text-[#D15B50]">{pay.errors.bankId.message}</span>}
      </label>}
      <Field label="Amount received" type="number" min={0} inputMode="decimal" suffix="NGN" error={pay.errors.amount?.message} {...pay.register('amount')}/>
      <div className="grid grid-cols-2 gap-2"><Button variant="ghost" onClick={pay.cancel}>Cancel</Button><Button type="submit" loading={pay.saving}>Save payment</Button></div>
    </form>}
  </div>
}
