import type { Shipment, ShipmentDetails } from '@/api/types'
import { formatNaira } from '@/lib/format'

const escape = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char)

/**
 * Prints one order's receipt (sink's ViewOrder "Print Receipt"): business, order, customer, items,
 * delivery fee, total, paid, payment and shipping status. Printed from a hidden frame, so only the
 * receipt prints (not the dashboard) and there's no pop-up for the browser to block.
 */
export function printReceipt({ shipment, details, businessName, deliveryMethod }: { shipment: Shipment; details?: ShipmentDetails; businessName: string; deliveryMethod: string }) {
  const order = details ?? shipment
  const lines = details?.products ?? []
  const fee = order.shippingFee ?? 0
  const total = order.amountValue ?? lines.reduce((sum, line) => sum + line.price * line.quantity, 0) + fee
  const itemsTotal = Math.max(total - fee, 0)
  const row = (label: string, value: string, strong = false) => `<tr${strong ? ' class="strong"' : ''}><td>${escape(label)}</td><td class="r">${escape(value)}</td></tr>`
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Receipt ${escape(shipment.id)}</title><style>
    @page { margin: 12mm }
    * { box-sizing: border-box }
    body { margin: 0; font: 12px/1.45 -apple-system, Segoe UI, Roboto, Arial, sans-serif; color: #17382C }
    .wrap { max-width: 360px; margin: 0 auto }
    h1 { margin: 0; font-size: 18px } .muted { color: #6E8077 } .r { text-align: right }
    .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; padding-bottom: 12px; border-bottom: 1px dashed #B9C8BF }
    h2 { margin: 16px 0 6px; font-size: 10px; letter-spacing: .12em; text-transform: uppercase; color: #6E8077 }
    table { width: 100%; border-collapse: collapse } td { padding: 4px 0; vertical-align: top }
    .items td { border-bottom: 1px solid #EEF2EF } .strong td { font-weight: 800; font-size: 14px; border-top: 1px dashed #B9C8BF; padding-top: 8px }
    .foot { margin-top: 18px; padding-top: 12px; border-top: 1px dashed #B9C8BF; text-align: center; color: #6E8077; font-size: 11px }
  </style></head><body><div class="wrap">
    <div class="head"><div><h1>${escape(businessName)}</h1><div class="muted">Order receipt</div></div><div class="r"><b>${escape(shipment.id)}</b><div class="muted">${escape(shipment.date)}</div></div></div>
    <h2>Customer</h2>
    <div><b>${escape(shipment.customer)}</b></div>
    ${order.customerPhone ? `<div class="muted">${escape(order.customerPhone)}</div>` : ''}
    <div class="muted">${escape(details?.address || shipment.destination)}</div>
    <h2>Items</h2>
    <table class="items">${lines.length ? lines.map(line => `<tr><td>${escape(line.name || 'Item')} <span class="muted">x${line.quantity}</span></td><td class="r">${escape(formatNaira(line.price * line.quantity))}</td></tr>`).join('') : `<tr><td class="muted">Items</td><td class="r">${escape(formatNaira(itemsTotal))}</td></tr>`}</table>
    <table style="margin-top:8px">
      ${row('Subtotal', formatNaira(itemsTotal))}
      ${row('Delivery fee', fee ? formatNaira(fee) : 'Free')}
      ${row('Total', formatNaira(total), true)}
      ${order.amountPaid != null ? row('Amount paid', formatNaira(order.amountPaid)) : ''}
      ${row('Payment', (order.paymentStatus || '-').toLowerCase().replace(/^\w/, c => c.toUpperCase()))}
    </table>
    <h2>Delivery</h2>
    <table>${row('Method', deliveryMethod)}${shipment.carrier && deliveryMethod.startsWith('Automated') ? row('Courier', shipment.carrier) : ''}${row('Status', order.status)}</table>
    <div class="foot">Thank you for your order.</div>
  </div></body></html>`

  const frame = document.createElement('iframe')
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'
  document.body.appendChild(frame)
  const doc = frame.contentWindow?.document
  if (!doc) { frame.remove(); throw new Error('No frame') }
  doc.open()
  doc.write(html)
  doc.close()
  setTimeout(() => { frame.contentWindow?.focus(); frame.contentWindow?.print() }, 150)
  setTimeout(() => frame.remove(), 60_000)
}
