import type { WalletTransaction } from '@/api/types'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'
import { formatNaira } from '@/lib/format'

/** One wallet transaction: icon, description, date and a signed amount (credit green, debit orange). */
export function TransactionRow({ transaction }: { transaction: WalletTransaction }) {
  const debit = transaction.kind === 'debit'
  return <div className="flex items-center gap-4 border-b border-[#EDF1EF] py-4 last:border-0">
    <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', debit ? 'bg-[#FFF1E5] text-[#BD7627]' : 'bg-[#EAF5E9] text-[#438352]')}><Icon name={transaction.icon} size={17}/></div>
    <div className="min-w-0 flex-1"><div className="truncate text-xs font-bold text-[#34483F]">{transaction.label}</div><div className="mt-1 text-[10px] text-[#91A098]">{transaction.date}</div></div>
    <div className={cn('shrink-0 text-xs font-extrabold', debit ? 'text-[#B9643D]' : 'text-[#438352]')}>{debit ? '-' : '+'}{formatNaira(transaction.amount)}</div>
  </div>
}
