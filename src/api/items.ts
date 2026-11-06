import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Papa from 'papaparse'
import { apiRequest, mockDelay } from '@/lib/api-client'
import { requireBusinessId, useCurrentBusinessId } from './business'
import { apiFormRequest, asRecord, isLive, listFrom, num, str } from './http'
import { db, PLACEHOLDER_ITEM_IMAGE } from './mock-data'
import { queryClient } from '@/lib/query-client'
import { queryKeys } from './query-keys'
import type { CatalogItem, ItemSale } from './types'

/**
 * Items = Sync360 products in live mode (they carry the product_id that
 * live shipment rates need):
 *  GET   product/business/{business_id}/?page&limit&search   → { results: { data: Product[] } }
 *  POST  product/business/{business_id}/                     multipart (name, selling_price, cost_price, weight, quantity, images)
 *  PATCH product/single_product/{product_id}/                multipart partial (selling_price, sell_online)
 *  GET   sale/dashboard/{business_id}/                       → { top_selling_products: [{ product__name, product__image, product__selling_price, quantity_sold }] }
 */

export type NewItemInput = { name: string; weight: string; price: string; image: string }

// ─── Live mappers/services ──────────────────────────────────────────────────

/** Stable numeric UI key from a UUID (CatalogItem.id is a number). */
const numericKey = (id: string) => {
  let hash = 0
  for (let index = 0; index < id.length; index += 1) hash = (hash * 31 + id.charCodeAt(index)) | 0
  return Math.abs(hash)
}

const productImage = (product: Record<string, unknown>) => {
  const media = listFrom(product.media, []).map(asRecord).find(item => str(item.type).toUpperCase() !== 'VIDEO' && str(item.file))
  return str(media?.file) || str(product.image) || PLACEHOLDER_ITEM_IMAGE
}

const mapProduct = (value: unknown): CatalogItem => {
  const product = asRecord(value)
  const productId = str(product.id)
  const quantity = num(product.quantity ?? product.stock)
  return {
    id: numericKey(productId),
    productId,
    name: str(product.name),
    weight: str(product.weight) || '0',
    price: String(num(product.selling_price ?? product.price)),
    image: productImage(product),
    quantity,
    // Listed on the storefront (sell_online) and actually in stock.
    inStock: product.sell_online !== false && (quantity > 0 || str(product.status).toUpperCase().replace('-', '_') === 'IN_STOCK'),
  }
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
      id: index + 1, name, weight: '0', price: String(price), image: str(row.product__image) || PLACEHOLDER_ITEM_IMAGE, inStock: str(row.product__status).toUpperCase() !== 'OUT-OF-STOCK',
    }
    return { item, orders: null, units, revenue: units * (price || Number(item.price)), last: null }
  })
}

const getLiveItems = async (businessId: string) =>
  listFrom(await apiRequest<unknown>(`product/business/${businessId}/?page=1&limit=100`), ['results.data', 'data', 'results']).map(mapProduct)

/** Same cache entry as useItems, so the sales view doesn't refetch the product list. */
const fetchItemsCached = (businessId: string) =>
  queryClient.fetchQuery({ queryKey: [...queryKeys.items, businessId], queryFn: () => getLiveItems(businessId), staleTime: 5 * 60 * 1000 })

const dataUrlToFile = async (dataUrl: string, name: string) => {
  const blob = await (await fetch(dataUrl)).blob()
  return new File([blob], `${name.replace(/\W+/g, '-').toLowerCase() || 'item'}.${blob.type.split('/')[1] || 'jpg'}`, { type: blob.type })
}

const addLiveItem = async (input: NewItemInput) => {
  const form = new FormData()
  form.append('name', input.name)
  form.append('selling_price', input.price || '0')
  form.append('cost_price', input.price || '0')
  form.append('weight', input.weight)
  form.append('quantity', '1')
  form.append('variation_type', 'single')
  form.append('sell_online', 'true')
  if (input.image.startsWith('data:')) form.append('images', await dataUrlToFile(input.image, input.name))
  return mapProduct(await apiFormRequest<unknown>(`product/business/${requireBusinessId()}/`, 'POST', form))
}

const patchLiveProduct = (productId: string, fields: Record<string, string>) => {
  const form = new FormData()
  for (const [key, value] of Object.entries(fields)) form.append(key, value)
  return apiFormRequest<unknown>(`product/single_product/${productId}/`, 'PATCH', form)
}

const patchLivePrice = (productId: string, price: string) => patchLiveProduct(productId, { selling_price: price })

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

const addMockItem = (input: NewItemInput) => {
  const item: CatalogItem = { id: Date.now(), ...input, price: input.price || '0', image: input.image || PLACEHOLDER_ITEM_IMAGE, inStock: true }
  db.items = [...db.items, item]
  return mockDelay(item)
}

// ─── Unified services ───────────────────────────────────────────────────────

const addItem = (input: NewItemInput) => (isLive() ? addLiveItem(input) : addMockItem(input))

/**
 * Live: price changes save selling_price; the availability switch saves
 * sell_online (whether the product shows on the storefront), as in sink-inventory.
 */
const updateItem = async ({ item, previous }: { item: CatalogItem; previous?: CatalogItem }) => {
  if (isLive() && item.productId && previous?.price !== item.price) await patchLivePrice(item.productId, item.price)
  if (isLive() && item.productId && previous && previous.inStock !== item.inStock) await patchLiveProduct(item.productId, { sell_online: String(item.inStock) })
  if (!isLive()) db.items = db.items.map(current => (current.id === item.id ? item : current))
  return mockDelay(item, isLive() ? 0 : 250)
}

const increasePrices = async ({ percentage, items }: { percentage: number; items: CatalogItem[] }) => {
  const updated = items.map(item => ({ ...item, price: String(Math.round(Number(item.price) * (1 + percentage / 100))) }))
  if (isLive()) {
    for (const item of updated) if (item.productId) await patchLivePrice(item.productId, item.price)
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

/** Parses a CSV with columns: item name, weight (kg), selling price, stock status. Live: creates each row as a product. */
const importItems = (file: File) =>
  new Promise<CatalogItem[]>((resolve, reject) => {
    Papa.parse<SheetRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async ({ data }) => {
        try {
          const rows = data
            .map(row => ({ name: pick(row, 'item name', 'name'), weight: pick(row, 'weight') || '0', price: pick(row, 'selling price', 'price') || '0', inStock: !/out|no|false|0/i.test(pick(row, 'stock')) }))
            .filter(row => row.name)
          if (isLive()) {
            const created: CatalogItem[] = []
            for (const row of rows) created.push(await addLiveItem({ name: row.name, weight: row.weight, price: row.price, image: '' }))
            resolve(created)
            return
          }
          const imported = rows.map((row, index): CatalogItem => ({ id: Date.now() + index, ...row, image: PLACEHOLDER_ITEM_IMAGE }))
          db.items = [...db.items, ...imported]
          resolve(imported)
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

/** Saves an item (price/availability). Signature unchanged: pass the updated item. */
export const useUpdateItem = () => {
  const queryClient = useQueryClient()
  const { key } = useItemsKey()
  return useMutation({
    mutationFn: (item: CatalogItem) => updateItem({ item, previous: queryClient.getQueryData<CatalogItem[]>(key)?.find(current => current.id === item.id) }),
    onSuccess: item => {
      queryClient.setQueryData<CatalogItem[]>(key, current => current?.map(existing => (existing.id === item.id ? item : existing)))
      if (!isLive()) queryClient.invalidateQueries({ queryKey: queryKeys.items })
    },
  })
}

/** Signature unchanged: pass the percentage. */
export const useIncreasePrices = () => {
  const queryClient = useQueryClient()
  const { key } = useItemsKey()
  return useMutation({
    mutationFn: (percentage: number) => increasePrices({ percentage, items: queryClient.getQueryData<CatalogItem[]>(key) ?? [] }),
    onSuccess: items => queryClient.setQueryData(key, items),
  })
}

/** Only .csv is parsed for now; .xlsx support needs the `xlsx` package (used in sink-inventory). */
export const useImportItems = () => {
  const invalidate = useInvalidateItems()
  return useMutation({ mutationFn: importItems, onSuccess: invalidate })
}

export const downloadImportTemplate = () => {
  const csv = 'Item name,Weight (kg),Selling price,Stock status\nClassic leather handbag,2.5,48000,In stock\n'
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'syncship-items-template.csv'
  anchor.click()
  URL.revokeObjectURL(url)
}
