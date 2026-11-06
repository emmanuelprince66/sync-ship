import type { Shipment } from '@/api/types'
import { DataTable } from '@/components/ui/DataTable'
import { useShipmentColumns } from '../hooks/useShipmentColumns'
import { ShipmentCard } from './ShipmentCard'

type ShipmentTableProps = {
  shipments: Shipment[]
  /** Dashboard preview: shows the latest 4 rows. */
  compact?: boolean
  loading?: boolean
  onView?: (shipment: Shipment) => void
}

export function ShipmentTable({ shipments, compact = false, loading = false, onView }: ShipmentTableProps) {
  const columns = useShipmentColumns(onView)
  return <DataTable columns={columns} data={compact ? shipments.slice(0, 4) : shipments} variant="default" minWidthClassName="min-w-[720px]" loading={loading} emptyState="No shipments found" getRowId={shipment => shipment.id} renderMobileCard={shipment => <ShipmentCard shipment={shipment} onView={onView}/>}/>
}
