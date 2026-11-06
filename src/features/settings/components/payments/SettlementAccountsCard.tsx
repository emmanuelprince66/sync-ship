import { Button } from '@/components/ui/Button'
import { IconTile } from '@/components/ui/common'
import { Icon } from '@/components/ui/Icon'
import { ListSkeleton } from '@/components/ui/Skeleton'
import { formatNaira } from '@/lib/format'
import { useSettlementAccountsCard } from '../../hooks/useSettlementAccounts'
import { ConfirmDialog } from '../ConfirmDialog'
import { AddBankModal } from './AddBankModal'

/** Bank accounts payouts settle into (sink-inventory Settings › Bank). */
export function SettlementAccountsCard() {
  const { accounts, isLoading, addModal, pendingDelete, askDelete, cancelDelete, confirmDelete, deleting } = useSettlementAccountsCard()

  return <div className="rounded-2xl border border-[#E2E9E5] p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><div className="text-xs font-extrabold text-[#304B40]">Settlement accounts</div><div className="mt-1 text-[10px] text-[#8A9891]">Where customer payments and withdrawals are paid out.</div></div>
      <Button variant="outline" icon="plus" onClick={addModal.open} className="px-3 py-2 text-xs">Add account</Button>
    </div>

    {isLoading ? <ListSkeleton rows={2} className="mt-3"/> : accounts.length === 0
      ? <div className="mt-4 rounded-xl border border-dashed border-[#C9D8CF] bg-[#FAFCFA] px-4 py-6 text-center"><div className="text-xs font-extrabold text-[#28483B]">No settlement account yet</div><div className="mt-1 text-[10px] text-[#829189]">Add the account you want payouts sent to.</div></div>
      : <ul className="mt-2">{accounts.map(account => <li key={account.id} className="flex items-center gap-3 border-b border-[#EDF1EF] py-3.5 last:border-0">
        <IconTile icon="bank" size={18}/>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-extrabold text-[#28483B]">{account.bankName}</div>
          <div className="mt-0.5 truncate text-[10px] text-[#87968F]"><span className="font-bold text-[#53665D]">{account.accountNumber}</span> · <span className="uppercase">{account.accountName}</span></div>
          {account.percentage !== null && <div className="mt-1 text-[9px] font-bold text-[#6E8377]">Charges: {account.percentage}% · min {formatNaira(account.minFee ?? 0)} · cap {formatNaira(account.maxFee ?? 0)}</div>}
        </div>
        <button type="button" onClick={() => askDelete(account)} aria-label={`Remove ${account.bankName} account`} className="rounded-lg p-2 text-[#A0ADA6] hover:bg-[#FFF0EE] hover:text-[#D15B50]"><Icon name="trash" size={16}/></button>
      </li>)}</ul>}

    <AddBankModal open={addModal.isOpen} onClose={addModal.close}/>
    <ConfirmDialog open={Boolean(pendingDelete)} title="Remove this account?" description={pendingDelete ? `${pendingDelete.bankName} · ${pendingDelete.accountNumber} will no longer receive payouts.` : ''} confirmLabel="Remove account" loading={deleting} onConfirm={confirmDelete} onClose={cancelDelete}/>
  </div>
}
