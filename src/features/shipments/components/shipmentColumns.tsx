import { createColumnHelper } from '@tanstack/react-table'
import type { Shipment } from '@/api/types'
import { Icon } from '@/components/ui/Icon'
import { BnplStatusBadge } from '@/features/bnpl'
import { StatusBadge } from './StatusBadge'

const column = createColumnHelper<Shipment>()

/** Shipments table columns, classes copied from the design. */
export const buildShipmentColumns = (onView?: (shipment: Shipment) => void) => [
  column.accessor('id', {
    header: 'Shipment',
    meta: { headerClassName: 'px-5', cellClassName: 'px-5' },
    cell: ({ row: { original } }) => <><div className="text-xs font-extrabold text-[#17382C]">{original.id}</div><div className="mt-0.5 text-[10px] text-[#91A098]">{original.date}</div></>,
  }),
  column.accessor('customer', {
    header: 'Customer',
    cell: ({ row: { original } }) => <><div className="text-xs font-bold text-[#34483F]">{original.customer}</div><div className="mt-0.5 text-[10px] text-[#91A098]">{original.destination}</div></>,
  }),
  column.accessor('carrier', {
    header: 'Delivery',
    cell: ({ getValue }) => <div className="flex items-center gap-2"><div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EFF4F1] text-[10px] font-black text-[#375B4A]">{getValue()[0]}</div><span className="text-xs font-semibold text-[#53665D]">{getValue()}</span></div>,
  }),
  column.accessor('status', { header: 'Status', cell: ({ getValue, row }) => <div className="flex flex-col items-start gap-1"><StatusBadge status={getValue()} rawStatus={row.original.rawStatus}/><BnplStatusBadge paymentType={row.original.paymentType} bnplStatus={row.original.bnplStatus} paid={row.original.paymentStatus?.toUpperCase() === 'PAID'}/></div> }),
  column.accessor('amount', { header: 'Amount', meta: { cellClassName: 'text-xs font-extrabold text-[#17382C]' } }),
  column.display({
    id: 'actions',
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row: { original } }) => <button type="button" onClick={() => onView?.(original)} className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[10px] font-extrabold text-[#438352] hover:bg-[#EAF5E9]">View more <Icon name="arrow" size={13}/></button>,
  }),
]
