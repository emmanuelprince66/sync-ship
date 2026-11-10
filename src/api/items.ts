import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Papa from 'papaparse'
import { apiRequest, mockDelay } from '@/lib/api-client'
import { fetchCurrentBusiness, requireBusinessId, useCurrentBusinessId } from './business'
import { apiFormRequest, asRecord, at, isLive, listFrom, num, str } from './http'
import { db } from './mock-data'
import { queryClient } from '@/lib/query-client'
import { queryKeys } from './query-keys'
import type { CatalogItem, ItemSale } from './types'

/**
 * Items = the business's Virtual Products: lightweight catalog items with no stock
 * tracking, which work in shipping rates, checkout and order manifests.
 *  GET    product/virtual/{business_id}/?search&availability&listed_on_storefront&page&page_size
 *  POST   product/virtual/{business_id}/         { name, price, description, weight, availability, listed_on_storefront }
 *  PATCH  product/virtual/{business_id}/{id}/    partial
 *  DELETE product/virtual/{business_id}/{id}/
 *  PATCH  business/{business_id}/                { storefront_product_source: 'INVENTORY' | 'VIRTUAL' }
 *  GET    sale/dashboard/{business_id}/          → { top_selling_products: [...] } (sales history)
 * Weights are kilograms. A new picture goes as multipart with an `image` file, the way
 * services and business logos do; every other save stays JSON.
 */

export type ItemInput = { name: string; description: string; price: string; weight: string; image: string; imageFile?: File | null; available: boolean; listed: boolean }

// ─── Live mappers/services ──────────────────────────────────────────────────

/** Stable numeric UI key from a UUID (CatalogItem.id is a number). */
const numericKey = (id: string) => {
  let hash = 0
  for (let index = 0; index < id.length; index += 1) hash = (hash * 31 + id.charCodeAt(index)) | 0
  return Math.abs(hash)
}

const mapVirtualProduct = (value: unknown): CatalogItem => {
  const product = asRecord(value)
  const productId = str(product.id)
  return {
    id: numericKey(productId),
    productId,
    name: str(product.name),
    description: str(product.description),
    weight: str(product.weight) || '0',
    price: String(num(product.price)),
    image: str(product.image) || str(product.image_url),
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
})

/** Fields as multipart, adding the picture file. */
const toFormData = (fields: Record<string, unknown>, imageFile: File) => {
  const form = new FormData()
  for (const [key, value] of Object.entries(fields)) if (value !== undefined && value !== null) form.append(key, String(value))
  form.append('image', imageFile)
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
  const response = input.imageFile
    ? await apiFormRequest<unknown>(path, 'POST', toFormData(toPayload(input), input.imageFile))
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

const addMockItem = (input: ItemInput) => {
  const item: CatalogItem = { id: Date.now(), name: input.name, description: input.description, price: input.price || '0', weight: input.weight || '0', image: input.image, inStock: input.available, listed: input.listed }
  db.items = [...db.items, item]
  return mockDelay(item)
}

// ─── Unified services ───────────────────────────────────────────────────────

const addItem = (input: ItemInput) => (isLive() ? addLiveItem(input) : addMockItem(input))

/** Saves what changed on an item: a quick price or availability change, or the whole edit form. */
const updateItem = async ({ imageFile, ...item }: CatalogItem & { imageFile?: File | null }) => {
  if (isLive() && item.productId) {
    const fields = {
      name: item.name,
      description: item.description ?? '',
      price: item.price,
      weight: item.weight,
      availability: item.inStock,
      listed_on_storefront: item.listed !== false,
    }
    if (imageFile) await apiFormRequest<unknown>(`product/virtual/${requireBusinessId()}/${item.productId}/`, 'PATCH', toFormData(fields, imageFile))
    else await patchLiveItem(item.productId, fields)
  } else {
    db.items = db.items.map(current => (current.id === item.id ? item : current))
  }
  return mockDelay(item, isLive() ? 0 : 250)
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

type SheetRow = Record<string, string | undefined>
const pick = (row: SheetRow, ...keys: string[]) => {
  const entry = Object.entries(row).find(([key]) => keys.some(k => key.trim().toLowerCase().startsWith(k)))
  return entry?.[1]?.trim() ?? ''
}

/** Parses a CSV with columns: item name, description, weight (kg), selling price, availability. Live: creates each row. */
const importItems = (file: File) =>
  new Promise<CatalogItem[]>((resolve, reject) => {
    Papa.parse<SheetRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async ({ data }) => {
        try {
          const rows: ItemInput[] = data
            .map(row => ({ name: pick(row, 'item name', 'name'), description: pick(row, 'description'), weight: pick(row, 'weight') || '0', price: pick(row, 'selling price', 'price') || '0', image: '', available: !/out|no|false|0|unavailable/i.test(pick(row, 'availability', 'stock')), listed: true }))
            .filter(row => row.name)
          const created: CatalogItem[] = []
          for (const row of rows) created.push(await addItem(row))
          resolve(created)
        } catch (error) {
          reject(error)
        }
      },
      error: reject,
    })
  })

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
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.items })
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
  const queryClient = useQueryClient()
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
      queryClient.setQueryData(key, source)
      queryClient.invalidateQueries({ queryKey: queryKeys.business })
    },
  })
  return { source: query.data ?? 'INVENTORY', isLoading: query.isLoading, setSource: mutation.mutate, isSaving: mutation.isPending }
}

/** Only .csv is parsed for now; .xlsx support needs the `xlsx` package (used in sink-inventory). */
export const useImportItems = () => {
  const invalidate = useInvalidateItems()
  return useMutation({ mutationFn: importItems, onSuccess: invalidate })
}

export const downloadImportTemplate = () => {
  const csv = 'Item name,Description,Weight (kg),Selling price,Availability\nClassic leather handbag,Full-grain leather,2.5,48000,Available\n'
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'syncship-items-template.csv'
  anchor.click()
  URL.revokeObjectURL(url)
}
