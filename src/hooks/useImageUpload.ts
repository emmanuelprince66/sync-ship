import { useCallback } from 'react'
import { toast } from 'sonner'
import { readFileAsDataUrl } from '@/lib/format'

/** Reads an image file as a data URL (for previews) after checking type and size (default 2 MB). Also hands back the file. */
export function useImageUpload(onLoaded: (dataUrl: string, file: File) => void, maxMb = 2) {
  return useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return toast.error('Please choose an image file.')
    if (file.size > maxMb * 1024 * 1024) return toast.error(`Image must be ${maxMb} MB or smaller.`)
    try {
      onLoaded(await readFileAsDataUrl(file), file)
    } catch {
      toast.error('Could not read that image. Try another file.')
    }
  }, [onLoaded, maxMb])
}
