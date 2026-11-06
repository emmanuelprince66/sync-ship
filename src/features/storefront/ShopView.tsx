import { SearchInput } from '@/components/ui/common'
import { ProductCard } from './ProductCard'
import type { StorefrontCheckout } from './hooks/useStorefrontCheckout'

type ShopViewProps = Pick<StorefrontCheckout, 'storeName' | 'search' | 'setSearch' | 'availableCount' | 'visibleProducts' | 'cart'>

export function ShopView({ storeName, search, setSearch, availableCount, visibleProducts, cart }: ShopViewProps) {
  return <main className="mx-auto max-w-6xl px-5 py-8 md:py-12">
    <div className="relative overflow-hidden rounded-3xl bg-[#EAF3E8] px-7 py-10 md:px-12">
      <div className="max-w-xl">
        <div className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#4D8057]">{storeName}</div>
        <div className="mt-3 text-3xl font-black leading-tight tracking-[-1px] text-[#09261C] md:text-4xl">Everyday pieces, thoughtfully selected.</div>
        <div className="mt-3 text-sm leading-6 text-[#647A6E]">Shop our available collection and get it delivered by the partner that works best for you.</div>
      </div>
      <div className="absolute -bottom-20 -right-12 h-64 w-64 rounded-full border-[45px] border-[#529661]/15"/>
    </div>
    <div className="mt-10 flex items-end justify-between">
      <div><div className="text-xl font-black text-[#17382C]">Shop all items</div><div className="mt-1 text-xs text-[#829189]">{availableCount} products available</div></div>
      <SearchInput value={search} onChange={setSearch} placeholder="Search products" iconSize={16} className="flex h-10 items-center gap-2 rounded-xl border border-[#DFE7E2] bg-white px-3 text-[#829189]" inputClassName="w-28 bg-transparent text-xs outline-none"/>
    </div>
    {visibleProducts.length === 0
      ? <div className="mt-6 rounded-3xl border border-dashed border-[#C9D8CF] bg-white p-10 text-center text-xs text-[#7D8E85]">No products match your search.</div>
      : <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visibleProducts.map(item => <ProductCard key={item.id} item={item} quantity={cart.quantityOf(item.id)} onAdd={() => cart.add(item.id)} onRemove={() => cart.remove(item.id)}/>)}
      </div>}
  </main>
}
