import { lazy } from 'react'

/**
 * Page modules, split per route. The import functions are kept separately so we
 * can warm them up (see preloadAppShell) before the user needs them.
 */
const loaders = {
  auth: () => import('@/features/auth/AuthPage'),
  selectBusiness: () => import('@/features/business/SelectBusinessPage'),
  dashboard: () => import('@/features/dashboard/DashboardPage'),
  shipments: () => import('@/features/shipments/ShipmentsPage'),
  createShipment: () => import('@/features/shipments/CreateShipmentPage'),
  items: () => import('@/features/items/ItemsPage'),
  storefront: () => import('@/features/storefront/StorefrontPage'),
  wallet: () => import('@/features/wallet/WalletPage'),
  settings: () => import('@/features/settings/SettingsPage'),
  kyc: () => import('@/features/kyc/KycPage'),
}

export const pages = {
  AuthPage: lazy(loaders.auth),
  SelectBusinessPage: lazy(loaders.selectBusiness),
  DashboardPage: lazy(loaders.dashboard),
  ShipmentsPage: lazy(loaders.shipments),
  CreateShipmentPage: lazy(loaders.createShipment),
  ItemsPage: lazy(loaders.items),
  StorefrontPage: lazy(loaders.storefront),
  WalletPage: lazy(loaders.wallet),
  SettingsPage: lazy(loaders.settings),
  KycPage: lazy(loaders.kyc),
}

/** Downloads the app's pages in the background, ignoring failures, so navigating never waits on code. */
export const preloadAppShell = () => {
  for (const load of [loaders.selectBusiness, loaders.dashboard, loaders.shipments, loaders.items, loaders.wallet, loaders.settings, loaders.createShipment, loaders.storefront]) load().catch(() => undefined)
}
