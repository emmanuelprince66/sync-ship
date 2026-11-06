import { Button } from '@/components/ui/Button'
import { PageHeader, SearchInput, SegmentedTabs } from '@/components/ui/common'
import { MediaCardGridSkeleton } from '@/components/ui/Skeleton'
import { AddItemModal } from './AddItemModal'
import { BulkPriceModal } from './BulkPriceModal'
import { EditPriceModal } from './EditPriceModal'
import { itemTabs, useItemsPage } from './hooks/useItemsPage'
import { ImportItemsModal } from './ImportItemsModal'
import { ItemList } from './ItemList'
import { SalesTable } from './SalesTable'
import { StorefrontCard } from './StorefrontCard'

export default function ItemsPage() {
  const page = useItemsPage()

  return <div className="space-y-6">
    <PageHeader
      title="Items"
      subtitle="Manage inventory, pricing, imports, and product sales."
      className="flex flex-wrap items-end justify-between gap-4"
      actions={<div className="flex w-full flex-wrap gap-2 sm:w-auto [&>button]:flex-1 [&>button]:whitespace-nowrap sm:[&>button]:flex-none"><Button variant="outline" icon="download" onClick={page.importModal.open}>Import Excel</Button><Button variant="outline" icon="chart" onClick={page.bulkPriceModal.open}>Update prices</Button><Button icon="plus" onClick={page.addModal.open}>Add item</Button></div>}
    />
    <SegmentedTabs value={page.tab} onChange={page.setTab} options={itemTabs} className="flex gap-1 rounded-xl bg-[#EAF1EC] p-1 sm:w-fit" buttonClassName="rounded-lg px-5 py-2 text-xs font-extrabold transition"/>
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <div className="rounded-3xl border border-[#E0E8E3] bg-white p-5 md:p-6">
        <div className="flex items-center justify-between">
          <div><div className="text-sm font-extrabold text-[#17382C]">{page.tab === 'inventory' ? 'Your item list' : 'Product sales'}</div><div className="mt-1 text-[10px] text-[#899890]">{page.tab === 'inventory' ? `${page.totalCount} saved items · ${page.inStockCount} in stock` : 'Includes storefront and virtual shipment products'}</div></div>
          <SearchInput value={page.search} onChange={page.setSearch} placeholder="Search items" iconSize={15} className="flex h-9 items-center gap-2 rounded-xl border border-[#DFE7E2] px-3 text-[#829189]" inputClassName="w-28 bg-transparent text-[10px] font-semibold outline-none"/>
        </div>
        {page.isLoading
          ? <MediaCardGridSkeleton count={6} className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"/>
          : page.tab === 'inventory'
          ? <ItemList items={page.visibleItems} onToggleStock={page.toggleStock} onEditPrice={page.openEditPrice}/>
          : <SalesTable sales={page.visibleSales}/>}
      </div>
      <div className="space-y-5">
        <StorefrontCard storeUrl={page.storeUrl} onViewStorefront={page.goToStorefront}/>
        <div className="rounded-2xl border border-[#DDE7E1] bg-white p-5"><div className="text-xs font-extrabold text-[#28483B]">Storefront activity</div><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl bg-[#F3F7F4] p-3"><div className="text-lg font-black text-[#17382C]">{page.isLoading ? '–' : page.activity.listed}</div><div className="text-[9px] text-[#829189]">Products listed</div></div><div className="rounded-xl bg-[#F3F7F4] p-3"><div className="text-lg font-black text-[#17382C]">{page.activity.orders ?? '–'}</div><div className="text-[9px] text-[#829189]">Orders</div></div></div></div>
      </div>
    </div>
    <ImportItemsModal open={page.importModal.isOpen} onClose={page.importModal.close}/>
    <BulkPriceModal open={page.bulkPriceModal.isOpen} onClose={page.bulkPriceModal.close}/>
    <EditPriceModal key={page.editItem?.id ?? 'none'} item={page.editItem} onClose={page.closeEditPrice}/>
    <AddItemModal open={page.addModal.isOpen} onClose={page.addModal.close}/>
  </div>
}
