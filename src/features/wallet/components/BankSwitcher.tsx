import type { WalletBankOption } from '@/api/wallet'
import { Icon } from '@/components/ui/Icon'

/**
 * Which wallet account the screens read (sink-inventory's BankSelector).
 * Hidden when the business has a single account: a one-option select is noise.
 */
export function BankSwitcher({ options, selectedId, onSelect }: { options: WalletBankOption[]; selectedId: string | null; onSelect: (id: string) => void }) {
  if (options.length < 2) return null
  return <label className="relative flex h-10 items-center gap-2 rounded-xl border border-[#DCE7E0] bg-white pl-3 pr-2 text-[#53645C]">
    <Icon name="bank" size={16}/>
    <select aria-label="Choose which account to view" value={selectedId ?? ''} onChange={event => onSelect(event.target.value)} className="max-w-[200px] appearance-none bg-transparent pr-6 text-xs font-extrabold text-[#17382C] outline-none">
      {options.map(option => <option key={option.id} value={option.id}>{option.label}{option.detail ? ` · ${option.detail}` : ''}</option>)}
    </select>
    <span className="pointer-events-none absolute right-2"><Icon name="chevron" size={15}/></span>
  </label>
}
