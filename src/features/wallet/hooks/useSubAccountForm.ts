import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { errorMessage } from '@/api/auth'
import { useCreateSubAccount } from '@/api/transactions'

const schema = z.object({
  previousAccount: z.string().trim().min(1, 'Enter your previous account number'),
  branch: z.string().trim().min(1, 'Enter the branch name'),
})

type Values = z.infer<typeof schema>

/** sink: "Create Sub Account" — previous account number + branch → wallet/create_sub_account/{business_id}/. */
export function useSubAccountForm({ businessId, onDone }: { businessId: string | null; onDone: () => void }) {
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { previousAccount: '', branch: '' } })
  const create = useCreateSubAccount()

  const onSubmit = form.handleSubmit(values => {
    if (!businessId) return toast.error('Select a business first')
    create.mutate({ businessId, ...values }, {
      onSuccess: () => { toast.success('Sub account created'); form.reset(); onDone() },
      onError: error => toast.error(errorMessage(error, 'Could not create the sub account')),
    })
  })

  return { register: form.register, errors: form.formState.errors, onSubmit, submitting: create.isPending, reset: () => form.reset() }
}
