import type { SettingsSection } from '@/api/types'

export const paths = {
  login: '/login',
  signup: '/signup',
  signupVerify: '/signup/verify',
  signupBusiness: '/signup/business',
  signupKyc: '/signup/kyc',
  selectBusiness: '/select-business',
  dashboard: '/',
  items: '/items',
  shipments: '/shipments',
  tracking: '/shipments/tracking',
  createShipment: '/shipments/new',
  wallet: '/wallet',
  fundWallet: '/wallet/fund',
  withdraw: '/wallet/withdraw',
  walletTransactions: '/wallet/transactions',
  settings: '/settings',
  customDomain: '/custom-domain',
  kyc: '/kyc',
  storefront: '/storefront',
  customers: '/customers',
} as const

/** A customer's profile page, e.g. /customers/abc123. */
export const customerPath = (id: string) => `${paths.customers}/${id}`

/** URL slug for each settings tab, e.g. /settings/payments. */
export const settingsSlugs: Record<SettingsSection, string> = {
  'Storefront': 'storefront',
  'Shipping setup': 'shipping',
  'Payments & KYC': 'payments',
  'Team & users': 'team',
  'Communications': 'communications',
  'Plan & billing': 'plan',
}

export const settingsPath = (section: SettingsSection) => `${paths.settings}/${settingsSlugs[section]}`

export const sectionFromSlug = (slug: string | undefined): SettingsSection =>
  (Object.entries(settingsSlugs).find(([, value]) => value === slug)?.[0] as SettingsSection | undefined) ?? 'Storefront'

/** Settings → Plan & billing, where every plan gate links to. */
export const planPath = () => settingsPath('Plan & billing')

/** Billing plans that include a custom domain, opened from domain upgrade prompts. */
export const customDomainUpgradePath = () => `${planPath()}?upgrade=custom-domain`

/** Custom-domain information and setup guide. */
export const customDomainInfoPath = () => paths.customDomain
