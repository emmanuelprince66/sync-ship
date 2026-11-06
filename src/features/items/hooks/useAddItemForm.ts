import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useAddItem } from '@/api/items'
import { useImageUpload } from '@/hooks/useImageUpload'
import { addItemDefaults, addItemSchema, type AddItemValues } from '../schemas'

export function useAddItemForm(onClose: () => void) {
  const addItem = useAddItem()
  const { register, handleSubmit, control, setValue, reset, formState: { errors } } = useForm<AddItemValues>({
    resolver: zodResolver(addItemSchema),
    defaultValues: addItemDefaults,
  })
  const [name, weight, image] = useWatch({ control, name: ['name', 'weight', 'image'] })

  const close = () => { reset(addItemDefaults); onClose() }

  const uploadImage = useImageUpload(dataUrl => setValue('image', dataUrl))

  const onSubmit = handleSubmit(values => addItem.mutate(values, {
    onSuccess: item => { toast.success(`${item.name} added to your items`); close() },
    onError: error => toast.error(errorMessage(error, 'Could not save the item')),
  }))

  return { register, errors, image, canSave: Boolean(name && weight), isSaving: addItem.isPending, uploadImage, onSubmit, close }
}
