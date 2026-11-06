/** "₦184,350.00" — wallet balances always show kobo, as in the design. */
export const formatBalance = (value: number) =>
  `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
