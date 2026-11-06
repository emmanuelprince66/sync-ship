import type { WalletTrx } from '@/api/transactions'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Modal, ModalHeader, ModalTitle } from '@/components/ui/Modal'
import { cn } from '@/lib/cn'
import { formatBalance, formatTrxDate } from '../format'
import type { ReceiptDetails } from '../types'

function Row({ label, value }: { label: string; value?: string }) {
  return <div className="flex items-start justify-between gap-4 border-b border-[#EDF1EF] py-3 text-xs last:border-0"><span className="shrink-0 text-[#7D8D85]">{label}</span><span className="break-all text-right font-extrabold text-[#193C2E]">{value || '—'}</span></div>
}

/** sink: TransactionDetails — amount hero, status, then the transaction's fields. */
export function TransactionDetailsModal({ trx, onClose, onReceipt }: { trx: WalletTrx | null; onClose: () => void; onReceipt: (receipt: ReceiptDetails) => void }) {
  const credit = trx?.type === 'CREDIT'
  return <Modal open={Boolean(trx)} onClose={onClose} panelClassName="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-[0_25px_80px_rgba(9,38,28,.2)]">
    {trx && <>
      <ModalHeader title="Transaction details" onClose={onClose}/>
      <div className={cn('mt-5 rounded-2xl p-5 text-center', credit ? 'bg-[#EDF7EC]' : 'bg-[#FDF1EF]')}>
        <span className={cn('mx-auto flex h-11 w-11 items-center justify-center rounded-full text-white', credit ? 'bg-[#529661]' : 'bg-[#D15B50]')}><Icon name={credit ? 'arrowIn' : 'arrowOut'} size={18}/></span>
        <p className={cn('mt-3 text-[11px] font-extrabold uppercase tracking-wide', credit ? 'text-[#3C7F4C]' : 'text-[#C2483D]')}>{credit ? 'Credit' : 'Debit'}</p>
        <p className="mt-1 text-2xl font-black text-[#09261C]">{credit ? '+' : '-'}{formatBalance(trx.amount)}</p>
        <span className={cn('mt-3 inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold', trx.status === 'SUCCESS' ? 'bg-white text-[#3C7F4C]' : trx.status === 'PENDING' ? 'bg-[#FFF4D9] text-[#A16A15]' : 'bg-white text-[#C2483D]')}>{trx.status}</span>
      </div>
      <div className="mt-4">
        <Row label="Transaction ID" value={trx.id}/>
        <Row label="Date & time" value={formatTrxDate(trx.createdAt)}/>
        <Row label="Account name" value={trx.accountName}/>
        <Row label="Bank name" value={trx.bankName}/>
        <Row label="Transaction type" value={trx.type}/>
        <Row label="Channel" value={trx.channel}/>
        {trx.isBnpl && <Row label="BNPL order" value={trx.bnplReference || 'Yes'}/>}
        {trx.charges > 0 && <Row label="Charges" value={formatBalance(trx.charges)}/>}
        {trx.description && <Row label="Description" value={trx.description}/>}
      </div>
      <Button variant="outline" icon="download" className="mt-5 w-full" onClick={() => onReceipt({ amount: trx.amount, beneficiaryName: trx.accountName, beneficiaryAccount: trx.accountNumber, beneficiaryBank: trx.bankName, narration: trx.description, transactionId: trx.reference, date: trx.createdAt, status: trx.status })}>View receipt</Button>
    </>}
  </Modal>
}

/** sink: TransferReceipt — printable receipt after a transfer or from a transaction. */
export function ReceiptModal({ receipt, onClose }: { receipt: ReceiptDetails | null; onClose: () => void }) {
  return <Modal open={Boolean(receipt)} onClose={onClose} panelClassName="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-[0_25px_80px_rgba(9,38,28,.2)]">
    {receipt && <>
      <div id="transfer-receipt" className="rounded-2xl border border-[#E2EAE5] p-5">
        <div className="flex items-center justify-between"><span className="text-sm font-black text-[#09261C]">Sync<span className="text-[#529661]">Ship</span></span><span className="rounded-full bg-[#E8F5E8] px-2.5 py-1 text-[10px] font-extrabold text-[#3C7F4C]">{receipt.status}</span></div>
        <ModalTitle className="mt-5 text-center text-[11px] font-extrabold uppercase tracking-wide text-[#829189]">Transfer receipt</ModalTitle>
        <p className="mt-1 text-center text-3xl font-black text-[#09261C]">{formatBalance(receipt.amount)}</p>
        <p className="mt-1 text-center text-[11px] text-[#829189]">{formatTrxDate(receipt.date)}</p>
        <div className="mt-5">
          {receipt.senderName && <Row label="From" value={receipt.senderName}/>}
          <Row label="Beneficiary" value={receipt.beneficiaryName}/>
          <Row label="Account number" value={receipt.beneficiaryAccount}/>
          <Row label="Bank" value={receipt.beneficiaryBank}/>
          {receipt.narration && <Row label="Narration" value={receipt.narration}/>}
          <Row label="Transaction ID" value={receipt.transactionId}/>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={onClose}>Back</Button>
        <Button icon="download" onClick={() => window.print()}>Print / save</Button>
      </div>
    </>}
  </Modal>
}
