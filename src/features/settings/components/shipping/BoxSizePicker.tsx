import type { BoxSize } from '@/api/types'
import { Icon } from '@/components/ui/Icon'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'

/** Shipbubble box presets as pickable tiles (sink-inventory BoxSizePickerModal, inline). */
export function BoxSizePicker({ sizes, selected, loading, error, onSelect }: { sizes: BoxSize[]; selected: string; loading: boolean; error?: string; onSelect: (name: string) => void }) {
  return <div>
    <div className="mb-2 text-[12px] font-extrabold text-[#34483F]">Default package size</div>
    {loading ? <SkeletonGroup label="Loading package sizes" className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">{Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-[104px] rounded-2xl"/>)}</SkeletonGroup>
      : sizes.length === 0 ? <div className="rounded-xl border border-dashed border-[#C9D8CF] p-4 text-center text-[11px] text-[#829189]">Package sizes aren’t available right now.</div>
        : <div role="radiogroup" aria-label="Default package size" className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          {sizes.map(size => <button key={size.name} type="button" role="radio" aria-checked={selected === size.name} onClick={() => onSelect(size.name)} className={cn('relative flex flex-col items-center rounded-2xl border-2 p-3 text-center transition', selected === size.name ? 'border-[#529661] bg-[#F5FAF4]' : 'border-[#E4EBE7] hover:border-[#C4D7C9]')}>
            {selected === size.name && <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#529661] text-white"><Icon name="check" size={10} stroke={3}/></span>}
            {size.imageUrl ? <img src={size.imageUrl} alt="" className="h-10 w-10 object-contain"/> : <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0F4F1] text-[#64776D]"><Icon name="box" size={20}/></span>}
            <span className="mt-2 text-[11px] font-extrabold text-[#28483B]">{size.name}</span>
            <span className="mt-0.5 text-[9px] text-[#87968F]">{size.length}×{size.width}×{size.height} cm</span>
            <span className="text-[9px] font-bold text-[#6E8377]">up to {size.maxWeight} kg</span>
          </button>)}
        </div>}
    {error && <span role="alert" className="mt-1.5 block text-[11px] font-semibold text-[#D15B50]">{error}</span>}
  </div>
}
