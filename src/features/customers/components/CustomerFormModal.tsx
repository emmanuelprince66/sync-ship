import type { Customer } from '@/api/customers'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { Modal, ModalHeader } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { TextAreaField } from '@/components/ui/TextAreaField'
import { useCustomerForm } from '../hooks/useCustomerForm'

type Props = { open: boolean; customer: Customer | null; onClose: (saved?: Customer) => void }

/** Add or edit a customer (sink's AddCustomer / EditCustomer). On phones it fills the screen with a fixed save bar. */
export function CustomerFormModal({ open, customer, onClose }: Props) {
  return <Modal open={open} onClose={() => onClose()} overlayClassName="bg-[#09261C]/40 p-0 backdrop-blur-[2px] sm:p-4" panelClassName="flex h-[100dvh] w-full flex-col bg-white shadow-[0_25px_80px_rgba(9,38,28,.2)] sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:max-w-lg sm:rounded-3xl">
    <ModalHeader title={customer ? 'Edit customer' : 'Add customer'} description={customer ? 'Update this customer’s contact details, address and notes.' : 'Only a name and phone number are required.'} onClose={() => onClose()} className="shrink-0 border-b border-[#EDF1EF] px-5 py-4 sm:px-6"/>
    {/* Mounted per opening, so each form starts from the saved values. */}
    {open && <CustomerForm key={customer?.id ?? 'new'} customer={customer} onClose={onClose}/>}
  </Modal>
}

function CustomerForm({ customer, onClose }: Omit<Props, 'open'>) {
  const form = useCustomerForm(customer, onClose)
  const { register, errors } = form

  return <form onSubmit={form.onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
      <div className="flex flex-col gap-4">
        <Field label="Name" placeholder="Customer name" autoComplete="off" error={errors.name?.message} {...register('name')}/>
        <Field label="Phone number" type="tel" inputMode="tel" placeholder="08012345678" autoComplete="off" error={errors.phone?.message} hint={form.isCheckingPhone ? 'Checking for an existing customer…' : undefined} {...register('phone')}/>

        {form.phoneMatches.length > 0 && <div role="status" className="rounded-2xl border border-[#F1DFB0] bg-[#FFF8E8] p-3">
          <div className="flex items-center gap-2 text-[11px] font-extrabold text-[#80662B]"><Icon name="user" size={15}/>{form.phoneMatches.length === 1 ? 'This number is already on file' : `${form.phoneMatches.length} customers have this number`}</div>
          <div className="mt-2 flex flex-col gap-2">
            {form.phoneMatches.map(match => <div key={match.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-white p-2.5">
              <div className="min-w-0 flex-1"><div className="truncate text-xs font-extrabold text-[#17382C]">{match.name}</div><div className="truncate text-[10px] text-[#899891]">{match.phone}{match.email ? ` · ${match.email}` : ''}</div></div>
              <Button variant="outline" className="px-3 py-1.5 text-[11px]" onClick={() => form.fillFrom(match)}>Fill in details</Button>
            </div>)}
          </div>
        </div>}

        <Field label="Email (optional)" type="email" placeholder="name@example.com" autoComplete="off" error={errors.email?.message} {...register('email')}/>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
          <Select label="Gender (optional)" placeholder="Select gender" options={form.genderOptions} error={errors.gender?.message} {...register('gender')}/>
          <Field label="Date of birth (optional)" type="date" max={form.maxBirthDate} error={errors.dateOfBirth?.message} {...register('dateOfBirth')}/>
        </div>

        <div className="mt-1 text-[10px] font-extrabold uppercase tracking-[.08em] text-[#899891]">Address (optional)</div>
        <Field label="Street address" placeholder="e.g. 22 Awolowo Road" autoComplete="off" error={errors.address?.message} {...register('address')}/>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
          <Select label="State" placeholder="Select state" options={form.stateOptions} error={errors.state?.message} {...register('state')}/>
          <Field label="City" placeholder="e.g. Ikeja" autoComplete="off" error={errors.city?.message} {...register('city')}/>
        </div>
        {form.isEditing && <Field label="Address phone" type="tel" placeholder="Delivery contact number" error={errors.addressPhone?.message} {...register('addressPhone')}/>}

        <TextAreaField label="Notes (optional)" rows={3} placeholder="Delivery preferences, sizes, anything worth remembering" hint={form.notesCount} error={errors.notes?.message} {...register('notes')}/>

        {!form.isEditing && <div role="note" className="flex items-start gap-2 rounded-xl bg-[#EAF5E9] p-3 text-[11px] leading-5 text-[#52705B]"><Icon name="shield" size={16}/><span>Ask your customers for permission before you send them marketing emails or SMS.</span></div>}
      </div>
    </div>
    <div className="flex shrink-0 justify-end gap-2 border-t border-[#EDF1EF] px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 [&>button]:flex-1 sm:[&>button]:flex-none">
      <Button variant="ghost" onClick={() => onClose()}>Cancel</Button>
      <Button type="submit" loading={form.isSubmitting}>{form.isEditing ? 'Save changes' : 'Add customer'}</Button>
    </div>
  </form>
}
