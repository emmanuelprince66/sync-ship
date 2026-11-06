import type { ReactNode } from 'react'
import { Icon } from '@/components/ui/Icon'
import type { AddressSuggestion } from '@/lib/address'
import { useAddressAutocomplete } from '../../hooks/useAddressAutocomplete'

type AddressAutocompleteProps = {
  value: string
  /** Every keystroke. The caller clears stale coordinates here. */
  onChange: (value: string) => void
  /** A picked suggestion: street/city/state + coordinates. */
  onSelect: (suggestion: AddressSuggestion) => void
  placeholder?: string
  /** Shows the "pinned" tick. The caller owns coordinate state. */
  hasCoordinates?: boolean
  /** Rendered once a completed search returned nothing (the GPS fallback). */
  renderNoResults?: () => ReactNode
}

/** Address search with a suggestion dropdown — sink-inventory's AddressAutocomplete in the SyncShip style. */
export function AddressAutocomplete({ value, onChange, onSelect, placeholder = 'Start typing an address...', hasCoordinates = false, renderNoResults }: AddressAutocompleteProps) {
  const { containerRef, ...field } = useAddressAutocomplete({ value, onChange, onSelect })

  return <div ref={containerRef} className="relative w-full">
    <span className="flex h-12 items-center gap-2 rounded-xl border border-[#DCE7E0] bg-white px-3.5 transition focus-within:border-[#529661] focus-within:ring-4 focus-within:ring-[#529661]/10">
      <span className={hasCoordinates && !field.isBusy ? 'text-[#438352]' : 'text-[#9AABA3]'}>
        {field.isBusy ? <span className="block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true"/> : <Icon name={hasCoordinates ? 'check' : 'search'} size={16}/>}
      </span>
      <input
        value={field.query}
        onChange={event => field.onType(event.target.value)}
        onFocus={field.onFocus}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={field.isOpen}
        aria-autocomplete="list"
        className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#09261C] outline-none placeholder:font-medium placeholder:text-[#9AABA3]"
      />
    </span>

    {field.isOpen && field.suggestions.length > 0 && <ul role="listbox" className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-[#DCE7E0] bg-white shadow-[0_15px_40px_rgba(9,38,28,.12)]">
      {field.suggestions.map(suggestion => <li key={suggestion.id} role="option" aria-selected={false}>
        <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => field.pick(suggestion)} className="flex w-full items-start gap-2.5 border-b border-[#EDF1EF] px-3 py-2.5 text-left transition-colors last:border-0 hover:bg-[#F3F9F2]">
          <span className="mt-0.5 shrink-0 text-[#438352]"><Icon name="location" size={15}/></span>
          <span className="min-w-0"><span className="block truncate text-xs font-extrabold text-[#17382C]">{suggestion.address || suggestion.label}</span><span className="block truncate text-[11px] text-[#7E8E86]">{suggestion.secondary || [suggestion.city, suggestion.state].filter(Boolean).join(', ') || suggestion.label}</span></span>
        </button>
      </li>)}
    </ul>}

    {renderNoResults && field.noResults && !hasCoordinates && renderNoResults()}
  </div>
}
