import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useItems, useItemSales, useItemsPage as useItemsPageQuery, useUpdateItem } from '@/api/items'
import { useBusinessSettings } from '@/api/settings'
import { useShipmentStats } from '@/api/shipments'
import type { CatalogItem } from '@/api/types'
import { useDebounce } from '@/hooks/useDebounce'
import { useDisclosure } from '@/hooks/useDisclosure'
import { paths } from '@/routes/paths'

export type ItemsTab = 'inventory' | 'sales'

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
  const updateItem = useUpdateItem()
  const [tab, setTab] = useState<ItemsTab>('inventory')
  const [search, setSearchState] = useState('')
  // Item list pages on the server like sink-inventory (page + rows per page + search).
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const debouncedSearch = useDebounce(search.trim(), 400)
  const pageQuery = useItemsPageQuery({ page, limit: pageSize, search: debouncedSearch })
  const setSearch = (value: string) => { setSearchState(value); setPage(1) }
  const [editItem, setEditItem] = useState<CatalogItem | null>(null)
  const addModal = useDisclosure()
  const importModal = useDisclosure()
  const bulkPriceModal = useDisclosure()

  const query = search.trim().toLowerCase()
  const matches = (name: string) => !query || name.toLowerCase().includes(query)

  const toggleStock = (item: CatalogItem) => updateItem.mutate({ ...item, inStock: !item.inStock }, {
    onError: error => toast.error(errorMessage(error, 'Could not update availability')),
  })

  return {
    isLoading: pageQuery.isLoading,
    /** Real counts only: products listed online and orders on record (no visits endpoint exists). */
    activity: { listed: items.filter(item => item.inStock).length, orders: stats?.totalShipments ?? null },
    tab,
    setTab,
    search,
    setSearch,
    totalCount: pageQuery.data?.total ?? items.length,
    inStockCount: items.filter(item => item.inStock).length,
    visibleItems: pageQuery.data?.items ?? [],
    pagination: { page, pages: pageQuery.data?.pages ?? 1, pageSize, setPage, setPageSize: (size: number) => { setPageSize(size); setPage(1) } },
    visibleSales: sales.filter(row => matches(row.item.name)),
    storeUrl: settings?.storeUrl ?? '',
    toggleStock,
    editItem,
    openEditPrice: setEditItem,
    closeEditPrice: () => setEditItem(null),
    addModal,
    importModal,
    bulkPriceModal,
    goToStorefront: () => navigate(paths.storefront),
  }
}
