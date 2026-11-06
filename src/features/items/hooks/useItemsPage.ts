import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useItems, useItemSales, useUpdateItem } from '@/api/items'
import { useBusinessSettings } from '@/api/settings'
import { useShipmentStats } from '@/api/shipments'
import type { CatalogItem } from '@/api/types'
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
  const { data: items = [], isLoading } = useItems()
  const { data: sales = [] } = useItemSales()
  const { data: settings } = useBusinessSettings()
  const { data: stats } = useShipmentStats()
  const updateItem = useUpdateItem()
  const [tab, setTab] = useState<ItemsTab>('inventory')
  const [search, setSearch] = useState('')
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
    isLoading,
    /** Real counts only: products listed online and orders on record (no visits endpoint exists). */
    activity: { listed: items.filter(item => item.inStock).length, orders: stats?.totalShipments ?? null },
    tab,
    setTab,
    search,
    setSearch,
    totalCount: items.length,
    inStockCount: items.filter(item => item.inStock).length,
    visibleItems: items.filter(item => matches(item.name)),
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
