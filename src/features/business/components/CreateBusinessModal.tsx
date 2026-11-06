import type { Business } from '@/api/business'
import { Button } from '@/components/ui/Button'
import { FilePicker } from '@/components/ui/common'
import { Field } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { Modal, ModalFooter, ModalHeader } from '@/components/ui/Modal'
import { SelectField } from '@/components/ui/SelectField'
import { useCreateBusinessForm } from '../hooks/useCreateBusinessForm'

type CreateBusinessModalProps = { open: boolean; onClose: () => void; onCreated: (business: Business) => void }

export function CreateBusinessModal({ open, onClose, onCreated }: CreateBusinessModalProps) {
  const { register, errors, onSubmit, reset, isSubmitting, logo, options } = useCreateBusinessForm({ onCreated })
  const close = () => { reset(); onClose() }

  return <Modal open={open} onClose={close} panelClassName="max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-[0_25px_80px_rgba(9,38,28,.2)] md:p-7">
    <ModalHeader title="Create a business" description="Add a new business to your account." onClose={close}/>
    <form onSubmit={onSubmit} noValidate className="mt-6">
      <FilePicker accept={logo.accept} onFile={logo.pick} className="block">
        <span className="mb-2 block text-[12px] font-extrabold text-[#34483F]">Business logo <span className="font-semibold text-[#9AABA3]">(optional)</span></span>
        <span className="flex items-center gap-4 rounded-2xl border border-dashed border-[#C9D8CF] bg-[#FAFCFA] p-4 transition hover:border-[#529661]">
          {logo.preview
            ? <img src={logo.preview} alt="Business logo preview" className="h-14 w-14 rounded-xl object-cover"/>
            : <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#EAF5E9] text-[#438352]"><Icon name="building" size={22}/></span>}
          <span><span className="block text-xs font-extrabold text-[#28483B]">{logo.preview ? 'Change logo' : 'Upload your logo'}</span><span className="mt-1 block text-[10px] text-[#87968F]">JPG, PNG or WebP · up to {logo.maxMb} MB</span></span>
        </span>
      </FilePicker>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Business name" placeholder="e.g. Kemi’s Store" className="sm:col-span-2" error={errors.name?.message} {...register('name')}/>
        <SelectField label="Business type" options={options.types} {...register('type')}/>
        <SelectField label="Currency" options={options.currencies} {...register('currency')}/>
        <Field label="Phone number" type="tel" placeholder="0803 245 7791" autoComplete="tel" error={errors.phone?.message} {...register('phone')}/>
        <Field label="Business email" type="email" placeholder="hello@business.com" autoComplete="email" error={errors.email?.message} {...register('email')}/>
        <Field label="Street address" placeholder="22 Awolowo Road" autoComplete="street-address" className="sm:col-span-2" error={errors.street?.message} {...register('street')}/>
        <Field label="City / town" placeholder="Ikoyi" autoComplete="address-level2" error={errors.city?.message} {...register('city')}/>
        <SelectField label="State" options={options.states} {...register('state')}/>
        <Field label="Country" autoComplete="country-name" className="sm:col-span-2" error={errors.country?.message} {...register('country')}/>
      </div>
      <ModalFooter className="mt-7">
        <Button variant="ghost" onClick={close}>Cancel</Button>
        <Button type="submit" icon="check" loading={isSubmitting}>Create business</Button>
      </ModalFooter>
    </form>
  </Modal>
}
