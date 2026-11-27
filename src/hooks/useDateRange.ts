import { useState } from 'react'

/** An inclusive from/to range as the API takes it (start_date / end_date, YYYY-MM-DD); '' = open. */
export type DateRange = { startDate: string; endDate: string }

/** State for a page's date filter; `onChange` runs on every change (e.g. back to page 1). */
export function useDateRange(onChange?: () => void) {
  const [range, setRange] = useState<DateRange>({ startDate: '', endDate: '' })
  const update = (next: DateRange) => { setRange(next); onChange?.() }
  return {
    ...range,
    active: Boolean(range.startDate || range.endDate),
    setStartDate: (startDate: string) => update({ ...range, startDate }),
    setEndDate: (endDate: string) => update({ ...range, endDate }),
    clear: () => update({ startDate: '', endDate: '' }),
    /** For the query: undefined when a side is open. */
    query: { startDate: range.startDate || undefined, endDate: range.endDate || undefined },
  }
}

export type DateRangeModel = ReturnType<typeof useDateRange>
