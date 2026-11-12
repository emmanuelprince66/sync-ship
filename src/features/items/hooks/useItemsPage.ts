import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useItems, useItemSales, useItemsPage as useItemsPageQuery, useSetItemFlags, useStorefrontSource, type StorefrontSource } from '@/api/items'
import { useBusinessSettings } from '@/api/settings'
import { useShipmentStats } from '@/api/shipments'
import type { CatalogItem } from '@/api/types'
import { useDebounce } from '@/hooks/useDebounce'
import { useDisclosure } from '@/hooks/useDisclosure'
import { paths } from '@/routes/paths'

export type ItemsTab = 'inventory' | 'sales'

export type ItemFilter = 'all' | 'available' | 'unavailable' | 'listed' | 'hidden'

export const itemFilters: readonly { value: ItemFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'available', label: 'Available' },
  { value: 'unavailable', label: 'Unavailable' },
  { value: 'listed', label: 'On storefront' },
  { value: 'hidden', label: 'Hidden' },
]

export const itemTabs: readonly { value: ItemsTab; label: string }[] = [
  { value: 'inventory', label: 'Item list' },
  { value: 'sales', label: 'Sales history' },
]

/** State and actions for the Items page: tabs, search, modals and availability toggles. */
export function useItemsPage() {
  const navigate = useNavigate()
  const { data: items = [] } = useItems()
  const { data: sales = [] } = useItemSales()
  const { data: settings } = useBusinessSettings()
  const { data: stats } = useShipmentStats()
  const [tab, setTab] = useState<ItemsTab>('inventory')
  const [search, setSearchState] = useState('')
  // Item list pages on the server like sink-inventory (page + rows per page + search).
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const debouncedSearch = useDebounce(search.trim(), 400)
  const [filter, setFilterState] = useState<ItemFilter>('all')
  const pageQuery = useItemsPageQuery({
    page,
    limit: pageSize,
    search: debouncedSearch,
    availability: filter === 'available' ? true : filter === 'unavailable' ? false : undefined,
    listed: filter === 'listed' ? true : filter === 'hidden' ? false : undefined,
  })
  const storefront = useStorefrontSource()
  const [formItem, setFormItem] = useState<CatalogItem | null>(null)
  const [deleteItem, setDeleteItem] = useState<CatalogItem | null>(null)
  const setSearch = (value: string) => { setSearchState(value); setPage(1) }
  const [editItem, setEditItem] = useState<CatalogItem | null>(null)
  const addModal = useDisclosure()
  const importModal = useDisclosure()
  const bulkPriceModal = useDisclosure()

  const query = search.trim().toLowerCase()
  const matches = (name: string) => !query || name.toLowerCase().includes(query)

  const setFlags = useSetItemFlags()
  /** Which switches are saving right now, as "itemId:flag", so each one can show its own spinner. */
  const [savingFlags, setSavingFlags] = useState<ReadonlySet<string>>(() => new Set())
  const markSaving = (key: string, on: boolean) => setSavingFlags(current => {
    const next = new Set(current)
    if (on) next.add(key)
    else next.delete(key)
    return next
  })
  const toggleAvailable = (item: CatalogItem) => {
    const key = `${item.id}:available`
    if (savingFlags.has(key)) return
    markSaving(key, true)
    setFlags.mutate({ item, flags: { available: !item.inStock } }, {
    onSettled: () => markSaving(key, false),
    onSuccess: saved => toast.success(saved.inStock ? `${saved.name} is available again` : `${saved.name} is now unavailable`),
    onError: error => toast.error(errorMessage(error, 'Could not update availability')),
  })
  }
  const toggleListed = (item: CatalogItem) => {
    const key = `${item.id}:listed`
    if (savingFlags.has(key)) return
    markSaving(key, true)
    setFlags.mutate({ item, flags: { listed: item.listed === false } }, {
    onSettled: () => markSaving(key, false),
    onSuccess: saved => {
      if (saved.listed === false) return toast.success(`${saved.name} is hidden from your storefront`)
      // Listed items only show online when the store serves these items rather than inventory.
      if (storefront.source !== 'VIRTUAL') {
        return toast.info(`${saved.name} is listed, but your storefront currently shows your inventory.`, {
          description: 'Switch “Store shows” to These items so customers can buy it online.',
          action: { label: 'Show these items', onClick: () => changeSource('VIRTUAL') },
        })
      }
      toast.success(`${saved.name} is on your storefront`)
    },
    onError: error => toast.error(errorMessage(error, 'Could not update the storefront listing')),
  })
  }
  const changeSource = (source: StorefrontSource) => {
    if (source === storefront.source) return
    storefront.setSource(source, {
      onSuccess: () => toast.success(source === 'VIRTUAL' ? 'Your storefront now shows these items' : 'Your storefront now shows your inventory'),
      onError: error => toast.error(errorMessage(error, 'Could not change what your storefront shows')),
    })
  }

  return {
    isLoading: pageQuery.isLoading,
    /** Real counts only: products listed online and orders on record (no visits endpoint exists). */
    activity: { listed: items.filter(item => item.inStock && item.listed !== false).length, orders: stats?.totalShipments ?? null },
    tab,
    setTab,
    search,
    setSearch,
    totalCount: pageQuery.data?.total ?? items.length,
    availableCount: items.filter(item => item.inStock).length,
    visibleItems: pageQuery.data?.items ?? [],
    pagination: { page, pages: pageQuery.data?.pages ?? 1, pageSize, setPage, setPageSize: (size: number) => { setPageSize(size); setPage(1) } },
    visibleSales: sales.filter(row => matches(row.item.name)),
    storeUrl: settings?.storeUrl ?? '',
    toggleAvailable,
    toggleListed,
    isSaving: (item: CatalogItem, flag: 'available' | 'listed') => savingFlags.has(`${item.id}:${flag}`),
    filter,
    setFilter: (value: ItemFilter) => { setFilterState(value); setPage(1) },
    isFiltered: Boolean(debouncedSearch) || filter !== 'all',
    formItem,
    openNewItem: () => { setFormItem(null); addModal.open() },
    openEditItem: (item: CatalogItem) => { setFormItem(item); addModal.open() },
    deleteItem,
    openDeleteItem: setDeleteItem,
    closeDeleteItem: () => setDeleteItem(null),
    storefrontSource: storefront.source,
    storefrontSourceBusy: storefront.isLoading || storefront.isSaving,
    showSourceNotice: !storefront.isLoading && storefront.source === 'INVENTORY',
    changeSource,
    editItem,
    openEditPrice: setEditItem,
    closeEditPrice: () => setEditItem(null),
    addModal,
    importModal,
    bulkPriceModal,
    goToStorefront: () => navigate(paths.storefront),
  }
}
