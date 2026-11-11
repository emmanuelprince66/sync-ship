import { Icon } from '@/components/ui/Icon'
import { FilePicker } from '@/components/ui/common'
import { cn } from '@/lib/cn'
import type { ItemGallery } from '../hooks/useItemGallery'

const tileButton = 'grid h-7 w-7 place-items-center rounded-full bg-white/90 text-[#29483B] shadow-sm transition hover:bg-white disabled:opacity-35'

/** Up to 5 pictures: add several at once, reorder, remove; the first is the cover. */
export function ItemGalleryField({ gallery }: { gallery: ItemGallery }) {
  return <div>
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[12px] font-extrabold text-[#34483F]">Pictures <span className="font-semibold text-[#9AABA3]">(optional)</span></span>
      <span className="text-[10px] font-bold text-[#93A39B]">{gallery.count}/{gallery.max}</span>
    </div>
    <p className="mt-0.5 text-[11px] leading-4 text-[#7C8D85]">{gallery.hint}</p>
    <ul className="mt-3 grid grid-cols-3 gap-2.5 sm:grid-cols-5" aria-label="Item pictures">
      {gallery.tiles.map((tile, index) => <li key={tile.key} className="group relative aspect-square overflow-hidden rounded-2xl bg-[#EEF3F0]">
        <img src={tile.url} alt={`Item picture ${index + 1}`} className="h-full w-full object-cover"/>
        {index === 0 && <span className="absolute left-1.5 top-1.5 rounded-lg bg-[#09261C]/85 px-1.5 py-0.5 text-[9px] font-black text-white">Cover</span>}
        {tile.remoteUrl && <span className="absolute bottom-9 left-1.5 rounded-lg bg-white/90 px-1.5 py-0.5 text-[9px] font-black text-[#29483B]">From SKU</span>}
        <button type="button" aria-label={`Remove picture ${index + 1}`} onClick={() => gallery.remove(tile.key)} className={cn(tileButton, 'absolute right-1.5 top-1.5')}><Icon name="close" size={12}/></button>
        <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between">
          <button type="button" aria-label={`Move picture ${index + 1} earlier`} disabled={index === 0} onClick={() => gallery.move(tile.key, -1)} className={tileButton}><span className="rotate-180"><Icon name="arrow" size={12}/></span></button>
          {index > 0 && <button type="button" onClick={() => gallery.makeCover(tile.key)} className="rounded-full bg-white/90 px-2 text-[9px] font-black text-[#29483B] shadow-sm hover:bg-white">Cover</button>}
          <button type="button" aria-label={`Move picture ${index + 1} later`} disabled={index === gallery.count - 1} onClick={() => gallery.move(tile.key, 1)} className={tileButton}><Icon name="arrow" size={12}/></button>
        </div>
      </li>)}
      {gallery.canAdd && <li>
        <FilePicker accept={gallery.accept} onFiles={gallery.addFiles} label="Add pictures" className="grid aspect-square w-full place-items-center rounded-2xl border border-dashed border-[#C9D8CF] bg-[#FAFCFA] text-[#577066] transition hover:border-[#529661]">
          <span className="text-center"><span className="mx-auto flex justify-center"><Icon name="plus" size={20}/></span><span className="mt-1 block text-[10px] font-black">Add pictures</span></span>
        </FilePicker>
      </li>}
    </ul>
  </div>
}
