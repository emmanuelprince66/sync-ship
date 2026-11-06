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

const VisibleBadge = ({ visible }: { visible: boolean }) =>
  <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-extrabold', visible ? 'bg-[#E4F2E1] text-[#438352]' : 'bg-[#F0F4F1] text-[#6A7C73]')}>{visible ? 'On checkout' : 'Hidden'}</span>

/** In-house shipping methods (sink-inventory's Shipping Method page), as a card in Shipping setup. */
export function ShippingMethodsCard() {
  const { methods, isLoading, editor, remove } = useShippingMethodsCard()
  const { register, formState: { errors } } = editor.form

  const columns = [
    column.accessor('createdLabel', { header: 'Created at', meta: { cellClassName: 'text-[11px] text-[#7E8E86]' } }),
    column.accessor('location', { header: 'Location', cell: ({ getValue }) => <span className="text-xs font-extrabold text-[#28483B]">{getValue()}</span> }),
    column.accessor('description', { header: 'Description', meta: { cellClassName: 'max-w-[240px] truncate text-[11px] text-[#7E8E86]' } }),
    column.accessor('feeLabel', { header: 'Amount', meta: { cellClassName: 'text-xs font-extrabold text-[#17382C]' } }),
    column.accessor('visible', { header: 'Web checkout', cell: ({ getValue }) => <VisibleBadge visible={getValue()}/> }),
    column.display({ id: 'actions', header: () => <span className="sr-only">Actions</span>, cell: ({ row }) => <RowActions row={row.original} onEdit={editor.open} onDelete={remove.ask}/> }),
  ]

  return <div className="rounded-2xl border border-[#E2E9E5] p-4 sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><div className="text-sm font-extrabold text-[#17382C]">Shipping methods</div><div className="mt-1 text-[10px] text-[#8A9891]">Your own delivery options — a fee per location for orders you deliver yourself.</div></div>
      <Button variant="outline" icon="plus" onClick={() => editor.open(null)} className="w-full px-3 py-2 text-xs sm:w-auto">Create shipping method</Button>
    </div>
    <div className="mt-3">
      <DataTable
        columns={columns}
        data={methods}
        variant="compact"
        minWidthClassName="min-w-[640px]"
        loading={isLoading}
        emptyState={<><span className="block font-extrabold text-[#28483B]">No Shipping Found</span><span className="mt-1 block">Please create a shipping.</span></>}
        getRowId={row => row.id}
        renderMobileCard={row => <div className="flex items-center gap-3 py-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2"><span className="truncate text-xs font-extrabold text-[#28483B]">{row.location}</span><span className="text-xs font-extrabold text-[#17382C]">{row.feeLabel}</span></div>
            {row.description && <div className="mt-0.5 truncate text-[10px] text-[#7E8E86]">{row.description}</div>}
            <div className="mt-1.5 flex items-center gap-2"><VisibleBadge visible={row.visible}/><span className="text-[10px] text-[#9AA8A1]">{row.createdLabel}</span></div>
          </div>
          <RowActions row={row} onEdit={editor.open} onDelete={remove.ask}/>
        </div>}
      />
    </div>

    <Modal open={editor.isOpen} onClose={editor.close} panelClassName="max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-5 shadow-[0_25px_80px_rgba(9,38,28,.2)] sm:p-7">
      <form onSubmit={editor.submit} noValidate>
        <ModalHeader title={editor.isEditing ? 'Edit Shipping Method' : 'Create Shipping Method'} onClose={editor.close}/>
        <div className="mt-6 space-y-4">
          <Field label="Location Name *" placeholder="e.g., United States, Europe, Worldwide" error={errors.location?.message} {...register('location')}/>
          <Field label="Shipping Fee" inputMode="decimal" placeholder="0.00" suffix="NGN" error={errors.fee?.message} {...register('fee')}/>
          <label className="block" htmlFor="shipping-description">
            <span className="mb-2 block text-[12px] font-extrabold text-[#34483F]">Shipping Description *</span>
            <textarea id="shipping-description" rows={3} placeholder="Describe the shipping method, delivery time, and any special conditions..." aria-invalid={errors.description ? true : undefined} className={cn('w-full resize-none rounded-xl border border-[#DCE7E0] bg-white px-3.5 py-3 text-sm font-semibold text-[#09261C] outline-none transition placeholder:font-medium placeholder:text-[#9AABA3] focus:border-[#529661] focus:ring-4 focus:ring-[#529661]/10', errors.description && 'border-[#E65A4F]')} {...register('description')}/>
            {errors.description && <span role="alert" className="mt-1.5 block text-[11px] font-semibold text-[#D15B50]">{errors.description.message}</span>}
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#E2E9E5] p-3.5">
            <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-[#529661]" {...register('visible')}/>
            <span><span className="block text-xs font-extrabold text-[#28483B]">Make shipping method visible on web checkout</span><span className="mt-0.5 block text-[10px] text-[#87968F]">When enabled, customers will see this option during checkout</span></span>
          </label>
        </div>
        <ModalFooter className="flex-col-reverse sm:flex-row">
          <Button variant="ghost" onClick={editor.close} disabled={editor.saving}>Cancel</Button>
          <Button type="submit" loading={editor.saving}>{editor.isEditing ? 'Update Shipping Method' : 'Create Shipping Method'}</Button>
        </ModalFooter>
      </form>
    </Modal>

    <ConfirmDialog open={Boolean(remove.pending)} title="Delete shipping method" description="Are you sure you want to delete this shipping method?" confirmLabel="Delete" loading={remove.deleting} onConfirm={remove.confirm} onClose={remove.cancel}/>
  </div>
}
