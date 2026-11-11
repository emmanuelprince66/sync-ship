import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { ApiError, apiRequest, mockDelay } from '@/lib/api-client'
import { fetchCurrentBusiness, requireBusinessId, useCurrentBusinessId } from './business'
import { apiErrorText, apiFormRequest, asRecord, at, isLive, listFrom, num, str } from './http'
import { db } from './mock-data'
import { queryClient } from '@/lib/query-client'
import { queryKeys } from './query-keys'
import type { CatalogItem, ItemMedia, ItemSale } from './types'

/**
 * Items = the business's Virtual Products: lightweight catalog items with no stock
 * tracking, which work in shipping rates, checkout and order manifests.
 *  GET    product/virtual/{business_id}/?search&availability&listed_on_storefront&page&page_size
 *  POST   product/virtual/{business_id}/         { name, price, description, weight, availability, listed_on_storefront }
 *  PATCH  product/virtual/{business_id}/{id}/    partial
 *  DELETE product/virtual/{business_id}/{id}/
 *  PATCH  business/{business_id}/                { storefront_product_source: 'INVENTORY' | 'VIRTUAL' }
 *  GET    sale/dashboard/{business_id}/          → { top_selling_products: [...] } (sales history)
 *  GET    product/sku/?sku=                      → one catalogue product (name, description, image, selling_price)
 * Weights are kilograms.
 *
 * Pictures (same contract as services): up to 5 per item. New files go as multipart, the
 * first as `image` (what the backend reads today) and every one as repeated `images`. On
 * PATCH, saved gallery pictures to keep go as repeated `kept_media_ids`, sent only when the
 * gallery was changed. Responses carry `media: [{ id, file, type }]`; older rows only have
 * `image` / `image_url`. A picture known only by URL (SKU lookup) goes as `image_url`.
 * Saves without picture changes stay JSON.
 */

export const ITEM_MAX_IMAGES = 5
export const ITEM_IMAGE_MAX_MB = 10
export const ITEM_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'] as const

export type ItemInput = {
  name: string
  description: string
  price: string
  weight: string
  /** Sample data only: the cover to show. */
  image: string
  available: boolean
  listed: boolean
  /** New picture files in gallery order. */
  newImages?: File[]
  /** A picture known only by its URL (from a SKU lookup), sent as `image_url`. */
  imageUrl?: string
  /** Sample data only: every picture to show, in order. */
  previewUrls?: string[]
}

/** What changed in an item's pictures when it is edited. */
export type GalleryChange = {
  newImages: File[]
  /** Saved pictures to keep, in order; null when the gallery wasn't touched. */
  keptMediaIds: string[] | null
  /** `image_url`: a URL to set, null to clear it, undefined to leave it. */
  imageUrl?: string | null
  /** Sample data only: every picture to show, in order. */
  previewUrls: string[]
}

// ─── Live mappers/services ──────────────────────────────────────────────────

/** Stable numeric UI key from a UUID (CatalogItem.id is a number). */
const numericKey = (id: string) => {
  let hash = 0
  for (let index = 0; index < id.length; index += 1) hash = (hash * 31 + id.charCodeAt(index)) | 0
  return Math.abs(hash)
}

/** Gallery pictures from `media` (type compared case-insensitively: the API sends "image" or "IMAGE"). */
const mapMedia = (value: unknown): ItemMedia[] => (Array.isArray(value) ? value : [])
  .map(asRecord)
  .filter(item => (str(item.type) || 'image').toLowerCase() === 'image')
  .map(item => ({ id: str(item.id), url: str(item.file) || str(item.url) }))
  .filter(item => item.id && item.url)

const mapVirtualProduct = (value: unknown): CatalogItem => {
  const product = asRecord(value)
  const productId = str(product.id)
  const media = mapMedia(product.media)
  return {
    id: numericKey(productId),
    productId,
    name: str(product.name),
    description: str(product.description),
    weight: str(product.weight) || '0',
    price: String(num(product.price)),
    image: media[0]?.url || str(product.image) || str(product.image_url),
    media,
    inStock: product.availability !== false,
    listed: product.listed_on_storefront !== false,
  }
}

const toPayload = (input: ItemInput) => ({
  name: input.name.trim(),
  description: input.description.trim(),
  price: input.price || '0',
  weight: input.weight || '0',
  availability: input.available,
  listed_on_storefront: input.listed,
  ...(input.imageUrl ? { image_url: input.imageUrl } : {}),
})

type PictureFields = { newImages: File[]; keptMediaIds?: string[] | null; imageUrl?: string | null }

/** Multipart is only needed to upload files or to say which saved pictures stay. */
const needsMultipart = ({ newImages, keptMediaIds }: PictureFields) => newImages.length > 0 || Boolean(keptMediaIds)

/** Fields as multipart with the pictures: `image` (first new file), repeated `images`, repeated `kept_media_ids`. */
const toFormData = (fields: Record<string, unknown>, { newImages, keptMediaIds, imageUrl }: PictureFields) => {
  const form = new FormData()
  for (const [key, value] of Object.entries(fields)) if (value !== undefined && value !== null) form.append(key, String(value))
  if (newImages[0]) form.append('image', newImages[0])
  newImages.forEach(file => form.append('images', file))
  if (keptMediaIds) {
    keptMediaIds.forEach(id => form.append('kept_media_ids', id))
    // An empty value says "keep none" (every saved picture was removed).
    if (keptMediaIds.length === 0) form.append('kept_media_ids', '')
  }
  if (imageUrl !== undefined) form.append('image_url', imageUrl ?? '')
  return form
}

/** Per-product sales from the sales dashboard; matched to catalog items for the image/price. */
const getLiveItemSales = async (businessId: string): Promise<ItemSale[]> => {
  const [response, items] = await Promise.all([apiRequest<unknown>(`sale/dashboard/${businessId}/`), fetchItemsCached(businessId).catch(() => [] as CatalogItem[])])
  return listFrom(response, ['top_selling_products', 'data.top_selling_products', 'results.top_selling_products']).map((value, index) => {
    const row = asRecord(value)
    const name = str(row.product__name) || 'Product'
    const price = num(row.product__selling_price)
    const units = num(row.quantity_sold)
    const item = items.find(product => product.name.toLowerCase() === name.toLowerCase()) ?? {
      id: index + 1, name, weight: '0', price: String(price), image: str(row.product__image), inStock: str(row.product__status).toUpperCase() !== 'OUT-OF-STOCK',
    }
    return { item, orders: null, units, revenue: units * (price || Number(item.price)), last: null }
  })
}

const ALL_ITEMS_PAGE_SIZE = 100
/** Safety stop: 2,000 items is far beyond what the shipment picker and bulk price tool need. */
const MAX_ITEM_PAGES = 20

/** Every virtual product (shipment item picker, bulk price update). */
const getLiveItems = async (businessId: string) => {
  const items: CatalogItem[] = []
  for (let page = 1; page <= MAX_ITEM_PAGES; page += 1) {
    const response = await apiRequest<unknown>(`product/virtual/${businessId}/?page=${page}&page_size=${ALL_ITEMS_PAGE_SIZE}`)
    items.push(...listFrom(response, ['results', 'data', 'results.data']).map(mapVirtualProduct))
    if (!at(response, 'next')) break
  }
  return items
}

/** Same cache entry as useItems, so the sales view doesn't refetch the product list. */
const fetchItemsCached = (businessId: string) =>
  queryClient.fetchQuery({ queryKey: [...queryKeys.items, businessId], queryFn: () => getLiveItems(businessId), staleTime: 5 * 60 * 1000 })

const addLiveItem = async (input: ItemInput) => {
  const path = `product/virtual/${requireBusinessId()}/`
  const pictures = { newImages: input.newImages ?? [] }
  const response = needsMultipart(pictures)
    ? await apiFormRequest<unknown>(path, 'POST', toFormData(toPayload(input), pictures))
    : await apiRequest<unknown>(path, { method: 'POST', body: toPayload(input) })
  return mapVirtualProduct(response)
}

const patchLiveItem = (productId: string, fields: Record<string, unknown>) =>
  apiRequest<unknown>(`product/virtual/${requireBusinessId()}/${productId}/`, { method: 'PATCH', body: fields })

// ─── Sample-data services ───────────────────────────────────────────────────

const getMockItemSales = (): Promise<ItemSale[]> => {
  const [first, second, third] = db.items
  const rows: (ItemSale | null)[] = [
    first ? { item: first, orders: 18, units: 22, revenue: 1056000, last: 'Today, 10:24 AM' } : null,
    second ? { item: second, orders: 11, units: 14, revenue: 455000, last: 'Yesterday, 4:12 PM' } : null,
    third ? { item: third, orders: 7, units: 8, revenue: 148000, last: 'Aug 24, 2:30 PM' } : null,
  ]
  return mockDelay(rows.filter((row): row is ItemSale => row !== null))
}

const mockMedia = (urls: string[], prefix: string): ItemMedia[] => urls.map((url, index) => ({ id: `${prefix}-${index}`, url }))

let mockSequence = 0
const addMockItem = (input: ItemInput) => {
  mockSequence += 1
  const id = Date.now() * 100 + mockSequence
  const media = mockMedia(input.previewUrls ?? (input.image ? [input.image] : []), `sample-${id}`)
  const item: CatalogItem = { id, name: input.name, description: input.description, price: input.price || '0', weight: input.weight || '0', image: media[0]?.url ?? '', media, inStock: input.available, listed: input.listed }
  db.items = [...db.items, item]
  return mockDelay(item)
}

// ─── Unified services ───────────────────────────────────────────────────────

const addItem = (input: ItemInput) => (isLive() ? addLiveItem(input) : addMockItem(input))

/** Saves what changed on an item: a quick price or availability change, or the whole edit form (with its pictures). */
const updateItem = async ({ gallery, ...item }: CatalogItem & { gallery?: GalleryChange }): Promise<CatalogItem> => {
  if (isLive() && item.productId) {
    const fields = {
      name: item.name,
      description: item.description ?? '',
      price: item.price,
      weight: item.weight,
      availability: item.inStock,
      listed_on_storefront: item.listed !== false,
    }
    if (gallery && needsMultipart(gallery)) {
      return mapVirtualProduct(await apiFormRequest<unknown>(`product/virtual/${requireBusinessId()}/${item.productId}/`, 'PATCH', toFormData(fields, gallery)))
    }
    await patchLiveItem(item.productId, gallery?.imageUrl !== undefined ? { ...fields, image_url: gallery.imageUrl } : fields)
    return item
  }
  const media = gallery ? mockMedia(gallery.previewUrls, `sample-${item.id}-${Date.now()}`) : item.media
  const saved = gallery ? { ...item, media, image: media?.[0]?.url ?? '' } : item
  db.items = db.items.map(current => (current.id === item.id ? saved : current))
  return mockDelay(saved, 250)
}

const deleteItem = async (item: CatalogItem) => {
  if (isLive() && item.productId) await apiRequest<unknown>(`product/virtual/${requireBusinessId()}/${item.productId}/`, { method: 'DELETE' })
  else db.items = db.items.filter(current => current.id !== item.id)
  return mockDelay(item, isLive() ? 0 : 250)
}

const increasePrices = async (percentage: number) => {
  const items = isLive() ? await fetchItemsCached(requireBusinessId()) : db.items
  const updated = items.map(item => ({ ...item, price: String(Math.round(Number(item.price) * (1 + percentage / 100))) }))
  if (isLive()) {
    for (const item of updated) if (item.productId) await patchLiveItem(item.productId, { price: item.price })
  } else {
    db.items = updated
  }
  return mockDelay(updated, isLive() ? 0 : 450)
}

// ─── SKU / barcode lookup ───────────────────────────────────────────────────

/** A catalogue product found by SKU. `price` is the selling price recorded against it ('' when none). */
export type SkuProduct = { sku: string; name: string; description: string; price: string; imageUrl: string }

const SAMPLE_SKUS: Record<string, SkuProduct> = {
  '6154000056789': { sku: '6154000056789', name: 'Peak Full Cream Milk Tin 400g', description: 'Evaporated full cream milk, 400 g tin.', price: '2400', imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=800' },
  'TOTE-001': { sku: 'TOTE-001', name: 'Canvas tote bag', description: 'Heavy cotton canvas tote with an inner pocket.', price: '12500', imageUrl: 'https://images.unsplash.com/photo-1597633125097-5a9ae3cb8a8f?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=800' },
}

const mapSkuProduct = (value: unknown, sku: string): SkuProduct | null => {
  const record = asRecord(value)
  const name = str(record.name).trim()
  if (!name) return null
  const media = mapMedia(record.media)
  const price = num(record.selling_price ?? record.price ?? record.amount)
  return {
    sku: str(record.sku) || sku,
    name,
    description: str(record.description),
    price: price > 0 ? String(price) : '',
    imageUrl: str(record.image) || str(record.image_url) || media[0]?.url || '',
  }
}

/** GET product/sku/?sku= → the product recorded against that SKU/barcode, or null when nobody has listed it. */
export const lookupSku = async (sku: string): Promise<SkuProduct | null> => {
  const code = sku.trim()
  if (!code) return null
  if (!isLive()) return mockDelay(SAMPLE_SKUS[code.toUpperCase()] ?? null, 500)
  let response: unknown
  try {
    response = await apiRequest<unknown>(`product/sku/?sku=${encodeURIComponent(code)}`)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
  // A flat product (as sink-inventory reads it), or a list / envelope around one.
  const list = listFrom(response, ['results', 'data', 'results.data'])
  const data = asRecord(response).data
  return mapSkuProduct(list.length ? list[0] : data && typeof data === 'object' ? data : response, code)
}

/**
 * A remote picture as an uploadable File. Fails soft (null): product images often sit on a
 * bucket without CORS headers, in which case the URL is kept and sent as `image_url`.
 */
export const fetchImageAsFile = async (url: string, name = 'sku-image'): Promise<File | null> => {
  try {
    const response = await fetch(url, { mode: 'cors' })
    if (!response.ok) return null
    const blob = await response.blob()
    if (!(ITEM_IMAGE_TYPES as readonly string[]).includes(blob.type) || blob.size > ITEM_IMAGE_MAX_MB * 1024 * 1024) return null
    return new File([blob], `${name}.${blob.type.split('/')[1] || 'jpg'}`, { type: blob.type })
  } catch {
    return null
  }
}

export const useSkuLookup = () => useMutation({ mutationFn: lookupSku })

// ─── Import ────────────────────────────────────────────────────────────────

/** One validated sheet row ready to create. `sku`, when given, fills a missing price/description and the picture. */
export type ImportItemRow = { name: string; description: string; price: string; weight: string; available: boolean; listed: boolean; sku: string }
export type ImportRowResult = { ok: true } | { ok: false; reason: string }

/** Creates one imported row (one POST each: the backend has no bulk endpoint for virtual products). */
const importItemRow = async (row: ImportItemRow): Promise<ImportRowResult> => {
  try {
    let { description, price } = row
    let imageUrl = ''
    if (row.sku) {
      const found = await lookupSku(row.sku).catch(() => null)
      if (found) {
        description ||= found.description
        price ||= found.price
        imageUrl = found.imageUrl
      }
    }
    if (!price) return { ok: false, reason: row.sku ? `No selling price in the sheet and none found for SKU ${row.sku}` : 'Selling price is missing' }
    await addItem({ name: row.name, description, price, weight: row.weight, image: imageUrl, imageUrl: imageUrl || undefined, available: row.available, listed: row.listed })
    return { ok: true }
  } catch (error) {
    return { ok: false, reason: apiErrorText(error, 'The server rejected this row') }
  }
}

const IMPORT_CONCURRENCY = 3

/**
 * Creates imported rows a few at a time, reporting progress, then refreshes the item list
 * (also after a partial import, so the rows that did go in show up).
 */
export const useImportItemRows = () => {
  const client = useQueryClient()
  return useCallback(async (rows: ImportItemRow[], onProgress: (done: number) => void) => {
    const results: ImportRowResult[] = new Array(rows.length)
    let next = 0
    let done = 0
    const worker = async () => {
      while (next < rows.length) {
        const index = next
        next += 1
        results[index] = await importItemRow(rows[index])
        done += 1
        onProgress(done)
      }
    }
    try {
      await Promise.all(Array.from({ length: Math.min(IMPORT_CONCURRENCY, rows.length) }, worker))
    } finally {
      await client.invalidateQueries({ queryKey: queryKeys.items })
    }
    return results
  }, [client])
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

const useItemsKey = () => {
  const { businessId } = useCurrentBusinessId()
  return { key: [...queryKeys.items, isLive() ? businessId : 'mock'] as const, businessId }
}

export type ItemsPageQuery = { page: number; limit: number; search: string; availability?: boolean; listed?: boolean }
export type ItemsPageResult = { items: CatalogItem[]; pages: number; total: number }

/** One page of virtual products, with the endpoint's search and availability/storefront filters. */
const getItemsPage = async (businessId: string, { page, limit, search, availability, listed }: ItemsPageQuery): Promise<ItemsPageResult> => {
  if (!isLive()) {
    const term = search.toLowerCase()
    const all = db.items.filter(item =>
      (!term || item.name.toLowerCase().includes(term))
      && (availability === undefined || item.inStock === availability)
      && (listed === undefined || (item.listed !== false) === listed))
    return mockDelay({ items: all.slice((page - 1) * limit, page * limit).map(item => ({ ...item })), pages: Math.max(Math.ceil(all.length / limit), 1), total: all.length })
  }
  const params = new URLSearchParams({ page: String(page), page_size: String(limit) })
  if (search) params.set('search', search)
  if (availability !== undefined) params.set('availability', String(availability))
  if (listed !== undefined) params.set('listed_on_storefront', String(listed))
  const response = await apiRequest<unknown>(`product/virtual/${businessId}/?${params.toString()}`)
  const items = listFrom(response, ['results', 'data', 'results.data']).map(mapVirtualProduct)
  const total = num(at(response, 'count')) || items.length
  return { items, pages: Math.max(Math.ceil(total / limit), 1), total }
}

export const useItemsPage = (query: ItemsPageQuery) => {
  const { businessId } = useCurrentBusinessId()
  return useQuery({
    queryKey: [...queryKeys.items, 'page', isLive() ? businessId : 'mock', query],
    queryFn: () => getItemsPage(businessId as string, query),
    enabled: !isLive() || Boolean(businessId),
    placeholderData: keepPreviousData,
  })
}

export const useItems = () => {
  const { key, businessId } = useItemsKey()
  return useQuery({
    queryKey: key,
    queryFn: () => (isLive() ? getLiveItems(businessId as string) : mockDelay(db.items.map(item => ({ ...item })))),
    enabled: !isLive() || Boolean(businessId),
  })
}

/** Per-product sales (live: sale/dashboard top sellers). */
export const useItemSales = () => {
  const { businessId } = useCurrentBusinessId()
  return useQuery({
    queryKey: [...queryKeys.itemSales, isLive() ? businessId : 'mock'],
    queryFn: () => (isLive() ? getLiveItemSales(businessId as string) : getMockItemSales()),
    enabled: !isLive() || Boolean(businessId),
  })
}

const useInvalidateItems = () => {
  const client = useQueryClient()
  return () => client.invalidateQueries({ queryKey: queryKeys.items })
}

export const useAddItem = () => {
  const invalidate = useInvalidateItems()
  return useMutation({ mutationFn: addItem, onSuccess: invalidate })
}

/** Saves an item (edit form, quick price change, availability or storefront switch). */
export const useUpdateItem = () => {
  const invalidate = useInvalidateItems()
  return useMutation({ mutationFn: updateItem, onSuccess: invalidate })
}

export const useDeleteItem = () => {
  const invalidate = useInvalidateItems()
  return useMutation({ mutationFn: deleteItem, onSuccess: invalidate })
}

/** Raises every item's price by a percentage. */
export const useIncreasePrices = () => {
  const invalidate = useInvalidateItems()
  return useMutation({ mutationFn: increasePrices, onSuccess: invalidate })
}

// ─── Storefront catalog source ──────────────────────────────────────────────

export type StorefrontSource = 'INVENTORY' | 'VIRTUAL'

let mockSource: StorefrontSource = 'VIRTUAL'

/** Which catalog the public storefront serves: inventory products or these items. */
export const useStorefrontSource = () => {
  const { businessId } = useCurrentBusinessId()
  const client = useQueryClient()
  const key = ['storefront-source', isLive() ? businessId : 'mock'] as const
  const query = useQuery({
    queryKey: key,
    queryFn: async (): Promise<StorefrontSource> => {
      if (!isLive()) return mockDelay(mockSource, 150)
      return str((await fetchCurrentBusiness()).raw.storefront_product_source).toUpperCase() === 'VIRTUAL' ? 'VIRTUAL' : 'INVENTORY'
    },
    enabled: !isLive() || Boolean(businessId),
  })
  const mutation = useMutation({
    mutationFn: async (source: StorefrontSource) => {
      if (isLive()) await apiRequest<unknown>(`business/${requireBusinessId()}/`, { method: 'PATCH', body: { storefront_product_source: source } })
      else mockSource = source
      return source
    },
    onSuccess: source => {
      client.setQueryData(key, source)
      client.invalidateQueries({ queryKey: queryKeys.business })
    },
  })
  return { source: query.data ?? 'INVENTORY', isLoading: query.isLoading, setSource: mutation.mutate, isSaving: mutation.isPending }
}
