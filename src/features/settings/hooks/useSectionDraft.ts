import { useState } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useSaveSettings } from '@/api/settings'
import type { BusinessSettings } from '@/api/types'

type SectionKey = Exclude<keyof BusinessSettings, 'storeUrl'>

/**
 * Local editable copy of one settings group, plus a save action that persists
 * just that group and shows the result as a toast.
 */
export const useSectionDraft = <K extends SectionKey>(key: K, initial: BusinessSettings[K], successMessage: string) => {
  const [draft, setDraft] = useState(initial)
  const mutation = useSaveSettings()

  const update = (patch: Partial<BusinessSettings[K]>) => setDraft(current => ({ ...current, ...patch }))

  const save = (value: BusinessSettings[K] = draft, message = successMessage) =>
    mutation.mutate({ [key]: value } as Partial<Pick<BusinessSettings, SectionKey>>, {
      onSuccess: () => toast.success(message),
      onError: error => toast.error(errorMessage(error)),
    })

  return { draft, setDraft, update, save: () => save(), saveWith: save, saving: mutation.isPending }
}
