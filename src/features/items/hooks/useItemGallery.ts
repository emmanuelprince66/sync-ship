import { useState } from 'react'
import { toast } from 'sonner'
import { fetchImageAsFile, ITEM_IMAGE_MAX_MB, ITEM_IMAGE_TYPES, ITEM_MAX_IMAGES, type GalleryChange } from '@/api/items'
import type { CatalogItem } from '@/api/types'

/**
 * A gallery tile: a saved picture (mediaId), a new file waiting to upload, a picture known
 * only by URL (SKU lookup → `image_url`), or an older item's single `image` (legacy).
 */
export type GalleryTile = { key: string; url: string; mediaId?: string; file?: File; remoteUrl?: string; legacy?: boolean }

const initialTiles = (item: CatalogItem | null): GalleryTile[] => {
  if (!item) return []
  // A media entry without an id is an older item's single picture (the legacy image).
  if (item.media?.length) return item.media.map((media, index) => (media.id ? { key: media.id, url: media.url, mediaId: media.id } : { key: `legacy-${index}`, url: media.url, legacy: true }))
  return item.image ? [{ key: 'legacy', url: item.image, legacy: true }] : []
}

let tileSequence = 0
const nextKey = (prefix: string) => { tileSequence += 1; return `${prefix}-${tileSequence}` }

/** Up to 5 pictures per item, reorderable; the first is the cover (as CLIQBOOK's service gallery). */
export function useItemGallery() {
  const [tiles, setTiles] = useState<GalleryTile[]>([])
  /** kept_media_ids is only sent once the gallery has been changed. */
  const [touched, setTouched] = useState(false)
  const [initial, setInitial] = useState<GalleryTile[]>([])

  const change = (update: (current: GalleryTile[]) => GalleryTile[]) => { setTiles(update); setTouched(true) }

  const addFiles = (files: File[]) => {
    const valid = files.filter(file => {
      if (!(ITEM_IMAGE_TYPES as readonly string[]).includes(file.type)) { toast.error(`${file.name}: use a JPG, PNG or GIF picture.`); return false }
      if (file.size > ITEM_IMAGE_MAX_MB * 1024 * 1024) { toast.error(`${file.name}: pictures must be ${ITEM_IMAGE_MAX_MB} MB or smaller.`); return false }
      return true
    })
    const room = ITEM_MAX_IMAGES - tiles.length
    if (valid.length > room) toast.error(`An item can have up to ${ITEM_MAX_IMAGES} pictures.`)
    const added = valid.slice(0, Math.max(room, 0)).map(file => ({ key: nextKey('new'), url: URL.createObjectURL(file), file }))
    if (added.length) change(current => [...current, ...added])
  }

  /** Adds a picture found online: uploaded as a file when the host allows it, otherwise kept by URL. */
  const addRemote = async (url: string) => {
    if (tiles.some(tile => tile.remoteUrl === url)) return
    if (tiles.length >= ITEM_MAX_IMAGES) { toast.error(`An item can have up to ${ITEM_MAX_IMAGES} pictures, so the SKU picture wasn’t added.`); return }
    const file = await fetchImageAsFile(url)
    // Only one picture can travel by URL (`image_url`), so a newer one replaces it.
    change(current => [...current.filter(tile => !tile.remoteUrl), file ? { key: nextKey('new'), url: URL.createObjectURL(file), file } : { key: nextKey('url'), url, remoteUrl: url }].slice(0, ITEM_MAX_IMAGES))
  }

  const remove = (key: string) => change(current => current.filter(tile => tile.key !== key))

  const move = (key: string, offset: -1 | 1) => change(current => {
    const index = current.findIndex(tile => tile.key === key)
    const target = index + offset
    if (index < 0 || target < 0 || target >= current.length) return current
    const next = [...current]
    ;[next[index], next[target]] = [next[target], next[index]]
    return next
  })

  const makeCover = (key: string) => change(current => {
    const tile = current.find(item => item.key === key)
    return tile ? [tile, ...current.filter(item => item.key !== key)] : current
  })

  const reset = (item: CatalogItem | null) => {
    const start = initialTiles(item)
    setTiles(start); setInitial(start); setTouched(false)
  }

  const remote = tiles.find(tile => tile.remoteUrl)
  const hadLegacy = initial.some(tile => tile.legacy)
  const keepsLegacy = tiles.some(tile => tile.legacy)

  /**
   * What to send on save. kept_media_ids is sent only when a saved picture was removed or
   * reordered (omitted = keep everything), so adding pictures never clears the legacy image.
   * Removing the legacy image sends the remaining saved ids (empty = clear). New items never send it.
   */
  const toChange = (isEdit: boolean): GalleryChange | undefined => {
    if (isEdit && !touched) return undefined
    const savedBefore = initial.flatMap(tile => (tile.mediaId ? [tile.mediaId] : []))
    const savedNow = tiles.flatMap(tile => (tile.mediaId ? [tile.mediaId] : []))
    const savedChanged = savedBefore.join('|') !== savedNow.join('|') || (hadLegacy && !keepsLegacy)
    return {
      newImages: tiles.flatMap(tile => (tile.file ? [tile.file] : [])),
      keptMediaIds: isEdit && savedChanged ? savedNow : null,
      // A URL picture is set; a removed older single picture is cleared.
      imageUrl: remote?.remoteUrl ?? (isEdit && hadLegacy && !keepsLegacy ? null : undefined),
      previewUrls: tiles.map(tile => tile.url),
    }
  }

  return {
    tiles,
    count: tiles.length,
    max: ITEM_MAX_IMAGES,
    canAdd: tiles.length < ITEM_MAX_IMAGES,
    accept: ITEM_IMAGE_TYPES.join(','),
    hint: `Up to ${ITEM_MAX_IMAGES} JPG, PNG or GIF pictures, ${ITEM_IMAGE_MAX_MB} MB each. The first one is the cover.`,
    addFiles,
    addRemote,
    remove,
    move,
    makeCover,
    reset,
    toChange,
  }
}

export type ItemGallery = ReturnType<typeof useItemGallery>
