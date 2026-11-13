import type { CatalogItem } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { ItemImage } from '@/components/ui/ItemImage'
import { Modal, ModalHeader } from '@/components/ui/Modal'
import { QuantityStepper } from '@/components/ui/QuantityStepper'
import { ListSkeleton } from '@/components/ui/Skeleton'
import { SearchInput } from '@/components/ui/common'
import { cn } from '@/lib/cn'
import { formatNaira } from '@/lib/format'
import type { CreateShipmentWizard } from '../../hooks/useCreateShipmentWizard'
import { useItemPicker } from '../../hooks/useItemPicker'

type Picker = ReturnType<typeof useItemPicker>

/** One saved item: picture, name, price, weight, availability, how many to add, and Add. */
function PickerRow({ item, picker, max }: { item: CatalogItem; picker: Picker; max: number }) {
  const inPackage = picker.inPackage(item)
  const room = picker.roomFor(item)
  const weight = Number(item.weight) > 0 ? `${item.weight} kg` : 'Default weight'
  return <li className={cn('flex flex-wrap items-center gap-3 rounded-2xl border bg-white p-3 sm:flex-nowrap', inPackage ? 'border-[#B9D9BF] bg-[#FAFDF9]' : 'border-[#E2EAE5]', !item.inStock && 'opacity-70')}>
    <div className="flex min-w-0 flex-1 basis-full items-center gap-3 sm:basis-auto">
      <ItemImage src={item.image} alt={item.name} className={cn('h-14 w-14 shrink-0 rounded-xl', !item.inStock && 'grayscale')} iconSize={20}/>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-extrabold text-[#17382C]">{item.name}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#7D8E85]">
          <span className="font-extrabold text-[#28483B]">{formatNaira(item.price)}</span>
          <span aria-hidden="true">·</span>
          <span title={Number(item.weight) > 0 ? undefined : 'Uses your default package weight'}>{weight}</span>
        </div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-extrabold', item.inStock ? 'bg-[#EAF5E9] text-[#438352]' : 'bg-[#3B4641] text-white')}>{item.inStock ? 'Available' : 'Unavailable'}</span>
          {inPackage > 0 && <span className="rounded-full bg-[#09261C] px-2 py-0.5 text-[9px] font-extrabold text-white">{inPackage} in package</span>}
        </div>
      </div>
    </div>
    {item.inStock
      ? <div className="ml-auto flex shrink-0 items-center gap-2">
        <QuantityStepper value={Math.min(picker.quantityFor(item), Math.max(room, 1))} onChange={value => picker.setQuantityFor(item, value)} max={Math.max(room, 1)} label={`How many ${item.name} to add`} size="sm"/>
        <Button variant="secondary" icon="plus" disabled={room < 1} onClick={() => picker.add(item)} className="h-10 px-3.5 text-xs">{room < 1 ? `Max ${max}` : 'Add'}</Button>
      </div>
      : <span className="ml-auto text-[11px] font-semibold text-[#8A9891]">Turn it on in Items to ship it</span>}
  </li>
}

function PickerBody({ wizard }: { wizard: CreateShipmentWizard }) {
  const picker = useItemPicker({ items: wizard.allItems, maxQuantity: wizard.maxQuantity, quantityInPackage: wizard.quantityInPackage, addFromCatalog: wizard.addFromCatalog })
  const { packageSummary, itemPicker } = wizard
  const hasItems = wizard.allItems.length > 0

  return <>
    <ModalHeader title="Add items" description="Pick from your saved items and choose how many." onClose={itemPicker.close} className="shrink-0 px-5 pt-5 sm:px-6"/>
    <div className="shrink-0 px-5 pb-3 pt-4 sm:px-6">
      <SearchInput value={picker.search} onChange={picker.setSearch} placeholder="Search by name or SKU" className="flex h-11 items-center gap-2 rounded-xl border border-[#DCE7E0] bg-white px-3.5 text-[#7B8B83] focus-within:border-[#529661] focus-within:ring-4 focus-within:ring-[#529661]/10" inputClassName="w-full bg-transparent text-sm font-semibold text-[#09261C] outline-none placeholder:font-medium placeholder:text-[#9AABA3]"/>
    </div>
    <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 sm:px-6">
      {wizard.catalogLoading
        ? <ListSkeleton rows={4} rowClassName="flex items-center gap-4 rounded-2xl border border-[#EDF1EF] p-3"/>
        : wizard.catalogError
          ? <div className="rounded-2xl border border-dashed border-[#E2D3CF] p-8 text-center text-xs text-[#7D8E85]">We couldn’t load your items. <button type="button" onClick={wizard.retryCatalog} className="font-extrabold text-[#438352]">Try again</button></div>
          : picker.visible.length === 0
            ? <div className="flex flex-col items-center rounded-2xl border border-dashed border-[#C9D8CF] bg-[#FAFCFA] p-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF5E9] text-[#438352]"><Icon name="box" size={22}/></div>
              <div className="mt-3 text-sm font-extrabold text-[#17382C]">{picker.isFiltered ? 'No items match' : 'No saved items yet'}</div>
              <div className="mt-1 max-w-xs text-xs leading-5 text-[#7D8E85]">{picker.isFiltered ? 'Try another name or SKU.' : wizard.canCreateItems ? 'Create your first item. It’s saved to your item list and added to this package.' : 'Ask your business owner or a super admin to add items.'}</div>
            </div>
            : <ul className="flex flex-col gap-2.5" aria-label="Saved items">{picker.visible.map(item => <PickerRow key={item.id} item={item} picker={picker} max={wizard.maxQuantity}/>)}</ul>}
    </div>
    <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-[#EDF1EF] px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:px-6">
      {wizard.canCreateItems && <Button variant={hasItems ? 'outline' : 'secondary'} icon="plus" onClick={wizard.openNewItem}>Create a new item</Button>}
      <div className="hidden flex-1 text-right text-[11px] text-[#7D8E85] sm:block">{packageSummary.units > 0 ? `${packageSummary.units} item${packageSummary.units === 1 ? '' : 's'} in this package` : 'Nothing added yet'}</div>
      <Button onClick={itemPicker.close}>{packageSummary.units > 0 ? `Done · ${packageSummary.units} item${packageSummary.units === 1 ? '' : 's'}` : 'Done'}</Button>
    </div>
  </>
}

/** Searchable list of saved items with a counter each; a new item can be created from here too. */
export function AddItemsModal({ wizard }: { wizard: CreateShipmentWizard }) {
  return <Modal open={wizard.itemPicker.isOpen} onClose={wizard.itemPicker.close} overlayClassName="bg-[#09261C]/40 p-0 backdrop-blur-[2px] sm:p-4" panelClassName="flex h-[100dvh] w-full flex-col bg-white shadow-[0_25px_80px_rgba(9,38,28,.2)] sm:h-[min(720px,calc(100dvh-2rem))] sm:max-w-2xl sm:rounded-3xl">
    <PickerBody wizard={wizard}/>
  </Modal>
}
