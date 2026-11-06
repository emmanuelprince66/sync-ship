import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Modal, ModalFooter, ModalHeader } from '@/components/ui/Modal'
import { SelectField } from '@/components/ui/SelectField'
import { ROLE_OPTIONS, useInviteEmployeeForm } from './hooks/useInviteEmployeeForm'

export function InviteEmployeeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { fields, errors, roleDescription, canSubmit, submitting, onSubmit, close } = useInviteEmployeeForm(onClose)

  return <Modal open={open} onClose={close} panelClassName="w-full max-w-lg rounded-3xl bg-white p-7 shadow-[0_30px_90px_rgba(9,38,28,.2)]">
    <form onSubmit={onSubmit} noValidate>
      <ModalHeader title="Register an employee" description="They sign in with their phone number and only see what their role allows." onClose={close} align="start"/>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="First name" placeholder="e.g. Ada" autoComplete="off" error={errors.firstname} {...fields.firstname}/>
        <Field label="Last name" placeholder="e.g. Okeke" autoComplete="off" error={errors.lastname} {...fields.lastname}/>
        <div className="sm:col-span-2"><Field label="Phone number" type="tel" placeholder="0802 000 0000" error={errors.phone} {...fields.phone}/></div>
        <div className="sm:col-span-2"><SelectField label="Employee role" options={ROLE_OPTIONS} {...fields.role}/></div>
      </div>
      {roleDescription && <div className="mt-5 rounded-xl bg-[#F1F7F1] p-4 text-[10px] leading-5 text-[#60766A]">{roleDescription}</div>}
      <ModalFooter><Button variant="ghost" onClick={close}>Cancel</Button><Button type="submit" loading={submitting} disabled={!canSubmit}>Add employee</Button></ModalFooter>
    </form>
  </Modal>
}
