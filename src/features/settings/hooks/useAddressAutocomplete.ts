import { useEffect, useRef, useState } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { useDismiss } from '@/hooks/useDismiss'
import { fetchAddressSuggestions, type AddressSuggestion } from '@/lib/address'

/** What a picked suggestion reads as in the field: its own line(s), minus the trailing country. */
const pickedText = (suggestion: AddressSuggestion) =>
  (suggestion.secondary ? `${suggestion.address}, ${suggestion.secondary}` : suggestion.label || suggestion.address).replace(/,\s*Nigeria\s*$/i, '').trim()

/**
 * sink-inventory's AddressAutocomplete logic: debounced search (350ms, 3+ characters),
 * a dropdown of suggestions, outside-click close, and a "no results" state that only
 * shows once a search has genuinely come back empty. Geoapify returns coordinates
 * with every suggestion, so a pick needs no second lookup.
 */
export const useAddressAutocomplete = ({ value, onChange, onSelect, disabled }: {
  value: string
  onChange: (value: string) => void
  onSelect: (suggestion: AddressSuggestion) => void
  disabled?: boolean
}) => {
  const [query, setQuery] = useState(value)
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  /** The query a search actually completed for — gates the no-results fallback. */
  const [searchedQuery, setSearchedQuery] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  /** No key configured: behave as a plain text input. */
  const [lookupDisabled, setLookupDisabled] = useState(false)
  /** Text that arrived programmatically (a pick, or hydration) — never searched for. Seeded with the initial value. */
  const [suppressed, setSuppressed] = useState<string | null>(value)
  const containerRef = useRef<HTMLDivElement>(null)
  const debouncedQuery = useDebounce(query, 350)

  // Keep in sync when the parent resets or hydrates the field (adjusting state during render).
  const [lastValue, setLastValue] = useState(value)
  if (value !== lastValue) {
    setLastValue(value)
    if (value !== query) { setSuppressed(value); setQuery(value) }
  }

  const shouldSearch = suppressed !== debouncedQuery && !lookupDisabled && !disabled && debouncedQuery.trim().length >= 3

  useEffect(() => {
    if (!shouldSearch) return
    let ignore = false
    fetchAddressSuggestions(debouncedQuery, { limit: 6 })
      .then(res => {
        if (ignore) return
        if (res.disabled) { setLookupDisabled(true); setSuggestions([]); setIsOpen(false); return }
        setSuggestions(res.data)
        setIsOpen(res.data.length > 0)
        setSearchedQuery(debouncedQuery)
      })
      .catch(() => { if (!ignore) { setSuggestions([]); setIsOpen(false) } })
      .finally(() => { if (!ignore) setIsSearching(false) })
    return () => { ignore = true }
  }, [debouncedQuery, shouldSearch])

  useDismiss(containerRef, isOpen, () => setIsOpen(false))

  const typing = query.trim().length >= 3 && query !== debouncedQuery && suppressed !== query
  // Spans typing → debounce → response, so the spinner is continuous.
  const isBusy = typing || (isSearching && shouldSearch)
  const tooShort = query.trim().length < 3

  return {
    containerRef,
    query,
    suggestions: tooShort ? [] : suggestions,
    isOpen: isOpen && !tooShort,
    isBusy,
    lookupDisabled,
    /** True once a completed search for the current text returned nothing. */
    noResults: !lookupDisabled && !disabled && !isBusy && suggestions.length === 0 && searchedQuery !== null && searchedQuery === debouncedQuery,
    onFocus: () => { if (suggestions.length > 0) setIsOpen(true) },
    onType: (next: string) => {
      setSuppressed(null)
      setQuery(next)
      if (next.trim().length >= 3 && !lookupDisabled) setIsSearching(true)
      onChange(next)
    },
    pick: (suggestion: AddressSuggestion) => {
      const text = pickedText(suggestion)
      setSuppressed(text)
      setQuery(text)
      setSuggestions([])
      setIsOpen(false)
      setIsSearching(false)
      onSelect({ ...suggestion, address: text })
    },
  }
}
