import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { downloadImportTemplate, useImportItems as useImportItemsMutation } from '@/api/items'
import { IMPORT_MAX_BYTES } from '../schemas'

/** Validates the chosen CSV, imports it, and reports the result. */
export function useImportItems(onClose: () => void) {
  const importItems = useImportItemsMutation()

  const importSheet = (file: File) => {
    if (importItems.isPending) return
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please save your sheet as a .csv file and try again.')
      return
    }
    if (file.size > IMPORT_MAX_BYTES) {
      toast.error('That file is larger than 5 MB.')
      return
    }
    importItems.mutate(file, {
      onSuccess: imported => {
        if (imported.length === 0) {
          toast.error('No items found. Check the column names match the template.')
          return
        }
        toast.success(`${imported.length} item${imported.length === 1 ? '' : 's'} imported`)
        onClose()
      },
      onError: error => toast.error(errorMessage(error, 'Could not import that file')),
    })
  }

  return { importSheet, isImporting: importItems.isPending, downloadTemplate: downloadImportTemplate }
}
