import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { STAFF_ROLES, useInviteEmployee } from '@/api/settings'
import { inviteEmployeeDefaults, inviteEmployeeSchema, toInternationalPhone, type InviteEmployeeValues } from '../schemas'

export const ROLE_OPTIONS = STAFF_ROLES.map(role => role.label)

export const useInviteEmployeeForm = (onClose: () => void) => {
  const invite = useInviteEmployee()
  const form = useForm<InviteEmployeeValues>({ resolver: zodResolver(inviteEmployeeSchema), defaultValues: inviteEmployeeDefaults })
  const [firstname, lastname, phone, role] = useWatch({ control: form.control, name: ['firstname', 'lastname', 'phone', 'role'] })
  const { errors } = form.formState

  const close = () => { form.reset(inviteEmployeeDefaults); onClose() }

  const onSubmit = form.handleSubmit(values => {
    const staffRole = STAFF_ROLES.find(item => item.label === values.role) ?? STAFF_ROLES[0]
    invite.mutate({ firstname: values.firstname, lastname: values.lastname, phone: toInternationalPhone(values.phone), role: staffRole.value }, {
      onSuccess: () => { toast.success(`${values.firstname} has been added to your team`); close() },
      onError: error => toast.error(errorMessage(error)),
    })
  })

  return {
    fields: {
      firstname: form.register('firstname'),
      lastname: form.register('lastname'),
      phone: form.register('phone'),
      role: form.register('role'),
    },
    errors: { firstname: errors.firstname?.message, lastname: errors.lastname?.message, phone: errors.phone?.message },
    roleDescription: STAFF_ROLES.find(item => item.label === role)?.description ?? '',
    canSubmit: Boolean(firstname && lastname && phone),
    submitting: invite.isPending,
    onSubmit,
    close,
  }
}
