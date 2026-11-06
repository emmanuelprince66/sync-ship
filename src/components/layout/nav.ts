import type { IconName } from '@/components/ui/Icon'
import { paths } from '@/routes/paths'

export const navItems: { id: 'dashboard' | 'items' | 'shipments' | 'wallet'; label: string; shortLabel: string; icon: IconName; to: string }[] = [
  { id: 'dashboard', label: 'Overview', shortLabel: 'Overview', icon: 'grid', to: paths.dashboard },
  { id: 'items', label: 'Items', shortLabel: 'Items', icon: 'card', to: paths.items },
  { id: 'shipments', label: 'Shipping & tracking', shortLabel: 'Shipments', icon: 'truck', to: paths.shipments },
  { id: 'wallet', label: 'Wallet', shortLabel: 'Wallet', icon: 'wallet', to: paths.wallet },
]
