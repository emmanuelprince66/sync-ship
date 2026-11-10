import { Icon } from '@/components/ui/Icon'
import { Button } from '@/components/ui/Button'
import { Pagination } from '@/components/ui/Pagination'
import { PageHeader, SearchInput, SegmentedTabs } from '@/components/ui/common'
import { MediaCardGridSkeleton } from '@/components/ui/Skeleton'
import { ItemFormModal } from './ItemFormModal'
import { DeleteItemModal } from './DeleteItemModal'
import { BulkPriceModal } from './BulkPriceModal'
import { EditPriceModal } from './EditPriceModal'
import { itemFilters, itemTabs, useItemsPage } from './hooks/useItemsPage'
import { ImportItemsModal } from './ImportItemsModal'
import { ItemList } from './ItemList'
import { SalesTable } from './SalesTable'
import { StorefrontCard } from './StorefrontCard'

export default function ItemsPage() {
  const page = useItemsPage()

  return <div className="space-y-6">
    <PageHeader
      title="Items"
      subtitle="Manage the items you sell and ship: pricing, imports, and product sales."
      className="flex flex-wrap items-end justify-between gap-4"
      actions={<div className="flex w-full flex-wrap gap-2 sm:w-auto [&>button]:flex-1 [&>button]:whitespace-nowrap sm:[&>button]:flex-none"><Button variant="outline" icon="download" onClick={page.importModal.open}>Import Excel</Button><Button variant="outline" icon="chart" onClick={page.bulkPriceModal.open}>Update prices</Button><Button icon="plus" onClick={page.openNewItem}>Add item</Button></div>}
    />
    <SegmentedTabs value={page.tab} onChange={page.setTab} options={itemTabs} className="flex gap-1 rounded-xl bg-[#EAF1EC] p-1 sm:w-fit" buttonClassName="rounded-lg px-5 py-2 text-xs font-extrabold transition"/>
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="rounded-3xl border border-[#E0E8E3] bg-white p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0"><div className="text-sm font-extrabold text-[#17382C]">{page.tab === 'inventory' ? 'Your item list' : 'Product sales'}</div><div className="mt-1 text-[10px] text-[#899890]">{page.tab === 'inventory' ? `${page.totalCount} saved items · ${page.availableCount} available` : 'Includes storefront and virtual shipment products'}</div></div>
          <SearchInput value={page.search} onChange={page.setSearch} placeholder="Search items" iconSize={15} className="flex h-9 items-center gap-2 rounded-xl border border-[#DFE7E2] px-3 text-[#829189]" inputClassName="w-28 bg-transparent text-[10px] font-semibold outline-none"/>
        </div>
        {page.tab === 'inventory' && <div className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0">{itemFilters.map(option => <button key={option.value} type="button" aria-pressed={page.filter === option.value} onClick={() => page.setFilter(option.value)} className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[11px] font-extrabold transition-colors ${page.filter === option.value ? 'border-[#286B43] bg-[#286B43] text-white' : 'border-[#DFE7E2] text-[#53665D] hover:bg-[#F3F7F4]'}`}>{option.label}</button>)}</div>}
        {page.tab === 'inventory' && page.showSourceNotice && <div role="note" className="mt-4 flex items-start gap-2 rounded-xl bg-[#FFF8E8] p-3 text-[11px] leading-5 text-[#80662B]"><Icon name="building" size={15}/><span>Your storefront currently shows your inventory products, so these items won’t appear there. You can still ship them. Switch under “Store shows”.</span></div>}
        {page.isLoading
          ? <MediaCardGridSkeleton count={6} className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"/>
          : page.tab === 'inventory'
          ? <><ItemList items={page.visibleItems} isFiltered={page.isFiltered} onAdd={page.openNewItem} onToggleAvailable={page.toggleAvailable} onToggleListed={page.toggleListed} onEditPrice={page.openEditPrice} onEdit={page.openEditItem} onDelete={page.openDeleteItem}/><Pagination className="-mx-5 mt-5 md:-mx-6" currentPage={page.pagination.page} totalPages={page.pagination.pages} onPageChange={page.pagination.setPage} pageSize={page.pagination.pageSize} onPageSizeChange={page.pagination.setPageSize} pageSizeOptions={[12, 24, 48, 96]}/></>
          : <SalesTable sales={page.visibleSales}/>}
      </div>
      <div className="space-y-5">
        <StorefrontCard storeUrl={page.storeUrl} onViewStorefront={page.goToStorefront} source={page.storefrontSource} sourceDisabled={page.storefrontSourceBusy} onSourceChange={page.changeSource}/>
        <div className="rounded-2xl border border-[#DDE7E1] bg-white p-5"><div className="text-xs font-extrabold text-[#28483B]">Storefront activity</div><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl bg-[#F3F7F4] p-3"><div className="text-lg font-black text-[#17382C]">{page.isLoading ? '–' : page.activity.listed}</div><div className="text-[9px] text-[#829189]">Products listed</div></div><div className="rounded-xl bg-[#F3F7F4] p-3"><div className="text-lg font-black text-[#17382C]">{page.activity.orders ?? '–'}</div><div className="text-[9px] text-[#829189]">Orders</div></div></div></div>
      </div>
    </div>
    <ImportItemsModal open={page.importModal.isOpen} onClose={page.importModal.close}/>
    <BulkPriceModal open={page.bulkPriceModal.isOpen} onClose={page.bulkPriceModal.close}/>
    <EditPriceModal key={page.editItem?.id ?? 'none'} item={page.editItem} onClose={page.closeEditPrice}/>
    <ItemFormModal open={page.addModal.isOpen} item={page.formItem} onClose={page.addModal.close}/>
    <DeleteItemModal item={page.deleteItem} onClose={page.closeDeleteItem}/>
  </div>
}
