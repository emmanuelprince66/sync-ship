import { createColumnHelper } from '@tanstack/react-table'
import type { ItemSale } from '@/api/types'
import { DataTable } from '@/components/ui/DataTable'
import { formatNaira } from '@/lib/format'

const column = createColumnHelper<ItemSale>()

const columns = [
  column.accessor('item', {
    header: 'Product',
    cell: ({ getValue }) => {
      const item = getValue()
      return <div className="flex items-center gap-3"><img src={item.image} alt="" className="h-10 w-10 rounded-xl object-cover"/><div><div className="text-[11px] font-extrabold text-[#28483B]">{item.name}</div><div className="mt-0.5 text-[9px] text-[#8A9992]">Storefront + shipping</div></div></div>
    },
  }),
  column.accessor('orders', { header: 'Orders', cell: ({ getValue }) => getValue() ?? '—', meta: { cellClassName: 'text-xs font-bold text-[#53665D]' } }),
  column.accessor('units', { header: 'Units sold', meta: { cellClassName: 'text-xs font-bold text-[#53665D]' } }),
  column.accessor('revenue', { header: 'Est. revenue', cell: ({ getValue }) => formatNaira(getValue()), meta: { cellClassName: 'text-xs font-black text-[#286B43]' } }),
  column.accessor('last', { header: 'Last sold', cell: ({ getValue }) => getValue() ?? '—', meta: { cellClassName: 'text-[10px] text-[#7E8E86]' } }),
]

export function SalesTable({ sales }: { sales: ItemSale[] }) {
  return <DataTable columns={columns} data={sales} variant="compact" minWidthClassName="min-w-[620px]" className="mt-5" getRowId={row => String(row.item.id)} emptyState="No sales match your search."/>
}
