/**
 * KYC tiers, document checklists and Shipbubble terms, ported from
 * sink-inventory (components/app/kyc/tiers.ts, ShipbubbleAgreementModal).
 * One source of truth: the limits here are the real per-day limits.
 */

export type KycTierInfo = { tier: number; title: string; requirement: string; limit: string }

export const INDIVIDUAL_TIERS: KycTierInfo[] = [
  { tier: 1, title: 'Basic verification', requirement: 'NIN or BVN', limit: '₦50,000' },
  { tier: 2, title: 'Enhanced verification', requirement: 'NIN and BVN', limit: '₦200,000' },
  { tier: 3, title: 'Full verification', requirement: 'NIN, BVN and address', limit: '₦5,000,000' },
]

export const CORPORATE_TIERS: KycTierInfo[] = [
  { tier: 1, title: 'Business information', requirement: 'Director & business details', limit: '₦100,000' },
  { tier: 2, title: 'Legal & director verification', requirement: 'CAC documents, TIN & directors', limit: '₦5,000,000' },
]

export type DocumentSpec = { key: string; label: string; hint: string; accept: string }

const PAPER = '.pdf,.jpg,.jpeg,.png'

/** Keys are the exact multipart field names POST wallet/upgrade_corporate_account/{id}/ expects. */
export const CORPORATE_DOCUMENTS = [
  { key: 'cac_certificate', label: 'CAC Certificate of Incorporation', hint: 'Issued by the Corporate Affairs Commission.', accept: PAPER },
  { key: 'cac_memorandum', label: 'MEMART', hint: 'Memorandum and Articles of Association.', accept: PAPER },
  { key: 'rc_document', label: 'RC / BN document', hint: 'The company registration document.', accept: PAPER },
  { key: 'status_report', label: 'CAC status report', hint: 'Current status report or extract from CAC.', accept: PAPER },
  { key: 'board_resolution', label: 'Board resolution', hint: 'Authorising this account to be opened.', accept: PAPER },
  { key: 'proof_of_address', label: 'Proof of business address', hint: 'Tenancy agreement or similar.', accept: PAPER },
  { key: 'utility_bill', label: 'Utility bill', hint: 'For the business address, under 3 months old.', accept: PAPER },
] as const satisfies readonly DocumentSpec[]

/** Per director: the endpoint takes fullname, identification and passport only. */
export const DIRECTOR_DOCUMENTS = [
  { key: 'identification', label: 'Government-issued ID', hint: 'NIN slip, voter’s card, driver’s licence or passport.', accept: PAPER },
  { key: 'passport', label: 'Passport photograph', hint: 'Recent photo on a plain background.', accept: 'image/*' },
] as const satisfies readonly DocumentSpec[]

export type CorporateDocKey = (typeof CORPORATE_DOCUMENTS)[number]['key']
export type DirectorDocKey = (typeof DIRECTOR_DOCUMENTS)[number]['key']

/** create_bank_account accepts exactly "BN" or "RC". */
export const BUSINESS_TYPES = [
  { value: 'BN', label: 'Business Name (BN)' },
  { value: 'RC', label: 'Limited Liability (RC)' },
] as const

export const SHIPBUBBLE_TERMS = [
  { title: 'Pickup at your store', body: 'Riders collect parcels from the pickup address you set. Make sure someone is available during business hours.' },
  { title: 'Delivery charges', body: 'Shipping fees are calculated at checkout and paid by the customer, unless you choose to cover them.' },
  { title: 'Liability & insurance', body: 'Items are insured for declared value in transit. Flag fragile or restricted items when packaging.' },
  { title: 'Data sharing', body: 'We share each order’s destination, weight and package size with Shipbubble so they can quote and dispatch it.' },
]

/** Max upload size for KYC documents. */
export const MAX_DOCUMENT_MB = 5
