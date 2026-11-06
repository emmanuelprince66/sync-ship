export type Option = { value: string; label: string }

/** Plain strings → select options where value and label match. */
export const toOptions = (values: readonly string[]): Option[] => values.map(value => ({ value, label: value }))
