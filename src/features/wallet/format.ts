import type { WalletTrx } from '@/api/transactions'

/** "₦184,350.00" — wallet amounts always show kobo (sink: formatToNaira). */
export const formatBalance = (value: number) =>
  `₦${(Number.isFinite(value) ? value : 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/** "•••• 1234" (sink: maskAccount). */
export const maskAccount = (accountNumber?: string) => (accountNumber ? `•••• ${accountNumber.slice(-4)}` : '••••')

/** "VM" for "VFD Microfinance" (sink: accountInitials). */
export const accountInitials = (bankName?: string) =>
  bankName?.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join('') || 'BK'

/** "Nov 6, 2026 9:41 AM" (sink: moment "MMM D, YYYY h:mm A"). */
export const formatTrxDate = (iso: string) => {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
}

export const exportTransactionsCsv = (rows: WalletTrx[]) => {
  const header = ['Transaction ID', 'Customer', 'Type', 'Channel', 'BNPL', 'Amount', 'Account number', 'Bank', 'Date', 'Status', 'Description']
  const body = rows.map(trx => [trx.id, trx.accountName, trx.type, trx.channel, trx.isBnpl ? `Yes ${trx.bnplReference}`.trim() : 'No', trx.amount, trx.accountNumber, trx.bankName, formatTrxDate(trx.createdAt), trx.status, trx.description])
  const csv = [header, ...body].map(row => row.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `syncship-transactions-${new Date().toISOString().slice(0, 10)}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}
