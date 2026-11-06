import { createColumnHelper } from '@tanstack/react-table'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { Field } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { Modal, ModalFooter, ModalHeader } from '@/components/ui/Modal'
import { cn } from '@/lib/cn'
import { useShippingMethodsCard, type ShippingMethodRow } from '../../hooks/useShippingMethods'
import { ConfirmDialog } from '../ConfirmDialog'

const column = createColumnHelper<ShippingMethodRow>()

const RowActions = ({ row, onEdit, onDelete }: { row: ShippingMethodRow; onEdit: (row: ShippingMethodRow) => void; onDelete: (row: ShippingMethodRow) => void }) =>
  <div className="flex justify-end gap-1">
    <button type="button" onClick={() => onEdit(row)} className="rounded-lg px-2.5 py-1.5 text-[10px] font-extrabold text-[#438352] hover:bg-[#EAF5E9]">Edit</button>
    <button type="button" onClick={() => onDelete(row)} aria-label={`Delete ${row.location}`} className="rounded-lg p-1.5 text-[#A0ADA6] hover:bg-[#FFF0EE] hover:text-[#D15B50]"><Icon name="trash" size={15}/></button>
  </div>

const FeeBadge = ({ row }: { row: ShippingMethodRow }) =>
  <span className={cn('text-xs font-extrabold', row.amount === null ? 'text-[#438352]' : 'text-[#17382C]')}>{row.feeLabel}</span>

/** Flat delivery fees per area, for orders you deliver yourself. */
export function ShippingMethodsCard() {
  const { methods, isLoading, editor, remove } = useShippingMethodsCard()
  const { register, formState: { errors } } = editor.form

  const columns = [
    column.accessor('location', { header: 'Area', cell: ({ getValue }) => <span className="text-xs font-extrabold text-[#28483B]">{getValue()}</span> }),
    column.accessor('description', { header: 'Details', meta: { cellClassName: 'max-w-[260px] truncate text-[11px] text-[#7E8E86]' } }),
    column.accessor('feeLabel', { header: 'Fee', cell: ({ row }) => <FeeBadge row={row.original}/> }),
    column.display({ id: 'actions', header: () => <span className="sr-only">Actions</span>, cell: ({ row }) => <RowActions row={row.original} onEdit={editor.open} onDelete={remove.ask}/> }),
  ]

  return <div className="rounded-2xl border border-[#E2E9E5] p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><div className="text-xs font-extrabold text-[#304B40]">Your own delivery rates</div><div className="mt-1 text-[10px] text-[#8A9891]">Flat fees for areas you deliver to yourself. Leave the fee empty for free delivery or pickup.</div></div>
      <Button variant="outline" icon="plus" onClick={() => editor.open(null)} className="px-3 py-2 text-xs">Add rate</Button>
    </div>
    <div className="mt-3">
      <DataTable
        columns={columns}
        data={methods}
        variant="compact"
        minWidthClassName="min-w-[520px]"
        loading={isLoading}
        emptyState="No delivery rates yet — add one for each area you cover."
        getRowId={row => row.id}
        renderMobileCard={row => <div className="flex items-center gap-3 py-3">
          <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className="truncate text-xs font-extrabold text-[#28483B]">{row.location}</span><FeeBadge row={row}/></div>{row.description && <div className="mt-0.5 truncate text-[10px] text-[#7E8E86]">{row.description}</div>}</div>
          <RowActions row={row} onEdit={editor.open} onDelete={remove.ask}/>
        </div>}
      />
    </div>

    <Modal open={editor.isOpen} onClose={editor.close} panelClassName="w-full max-w-md rounded-3xl bg-white p-6 shadow-[0_25px_80px_rgba(9,38,28,.2)] sm:p-7">
      <form onSubmit={editor.submit} noValidate>
        <ModalHeader title={editor.isEditing ? 'Edit delivery rate' : 'Add delivery rate'} description="Customers see this option at checkout." onClose={editor.close}/>
        <div className="mt-6 space-y-4">
          <Field label="Area or option name" placeholder="e.g. Lagos Island, Store pickup" error={errors.location?.message} {...register('location')}/>
          <Field label="Delivery fee" inputMode="decimal" placeholder="0 = free" suffix="NGN" hint="Leave empty or 0 to make it free" error={errors.fee?.message} {...register('fee')}/>
          <Field label="Details (optional)" placeholder="e.g. Same-day for orders before 2pm" error={errors.description?.message} {...register('description')}/>
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={editor.close}>Cancel</Button>
          <Button type="submit" loading={editor.saving}>{editor.isEditing ? 'Save rate' : 'Add rate'}</Button>
        </ModalFooter>
      </form>
    </Modal>

    <ConfirmDialog open={Boolean(remove.pending)} title="Delete this delivery rate?" description={remove.pending ? `Customers will no longer see “${remove.pending.location}” at checkout.` : ''} confirmLabel="Delete rate" loading={remove.deleting} onConfirm={remove.confirm} onClose={remove.cancel}/>
  </div>
}
