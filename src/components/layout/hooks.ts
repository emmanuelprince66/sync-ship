import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useShipments } from '@/api/shipments'
import { useKycStatus } from '@/api/kyc'
import { useUnreadNotifications } from '@/api/notifications'
import { formatLongDate, initials } from '@/lib/format'
import { paths, settingsPath } from '@/routes/paths'
import { useAuthStore, type AuthUser } from '@/stores/auth-store'
import { useBusinessDataStore } from '@/stores/business-data-store'
import { useSetupProgress } from '@/features/onboarding/useSetupProgress'
import { useUiStore } from '@/stores/ui-store'
import type { SettingsSection } from '@/api/types'

/** Data and actions for the sidebar: active-shipment badge, account block, switch business and logout. */
export function useSidebar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const queryClient = useQueryClient()
  const { data: shipments = [] } = useShipments()
  const business = useBusinessDataStore(state => state.businessData)
  const logout = useAuthStore(state => state.logout)
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = useCallback(() => setMenuOpen(false), [])

  const businessName = business?.name || 'Your business'
  return {
    activeShipments: shipments.filter(shipment => shipment.status === 'In transit' || shipment.status === 'Awaiting pickup').length,
    businessName,
    businessLogo: business?.logo ?? '',
    accountInitials: initials(businessName),
    menuOpen,
    toggleMenu: () => setMenuOpen(open => !open),
    closeMenu,
    /** The picker clears the old business's data only if a different one is chosen. */
    switchBusiness: () => {
      setMenuOpen(false)
      navigate(paths.selectBusiness, { state: { from: pathname } })
    },
    signOut: () => {
      setMenuOpen(false)
      logout()
      queryClient.clear()
      navigate(paths.login, { replace: true })
    },
  }
}

const ROLE_LABELS: Record<string, string> = { OWNER: 'Owner', 'ADMIN-ATTENDANT': 'Admin', ATTENDANT: 'Attendant', PHARMACIST: 'Pharmacist', ACCOUNTANT: 'Accountant', 'INVENTORY-MANAGER': 'Inventory manager', 'PRODUCTION-MANAGER': 'Production manager' }

/** Everything the top bar and its profile menu show and do (mirrors sink-inventory's TopBar). */
const resolveUserName = (user: AuthUser | null | undefined) => {
  const fromNameParts = [user?.firstname, user?.lastname].filter(Boolean).join(' ')
  if (fromNameParts) return fromNameParts
  return user?.fullName || user?.name || user?.email?.split('@')[0] || ''
}

export function useTopBar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const queryClient = useQueryClient()
  const user = useAuthStore(state => state.user)
  const logout = useAuthStore(state => state.logout)
  const business = useBusinessDataStore(state => state.businessData)
  const { data: kyc } = useKycStatus()
  const { data: unread = 0 } = useUnreadNotifications()
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  const go = (to: string) => { setMenuOpen(false); navigate(to) }

  const fullName = resolveUserName(user)
  const firstName = user?.firstname || user?.name?.split(/\s+/)[0] || fullName.split(/\s+/)[0] || ''
  const tier = kyc?.tier ?? 0
  return {
    isOverview: pathname === paths.dashboard,
    firstName,
    fullName,
    email: user?.email ?? '',
    initials: initials(fullName || business?.name || 'U'),
    roleLabel: (user?.role && ROLE_LABELS[user.role]) || 'Member',
    isOwner: !user?.role || user.role === 'OWNER',
    businessName: business?.name ?? '',
    date: formatLongDate(),
    unread,
    /** Header badge, shown once KYC status has loaded. */
    verification: kyc ? { text: tier > 0 ? 'Verified' : 'Pending', ok: tier > 0 } : null,
    kycBadge: kyc ? { text: tier > 0 ? `Tier ${tier}` : 'Not started', ok: tier > 0 } : undefined,
    menuOpen,
    toggleMenu: () => setMenuOpen(open => !open),
    closeMenu,
    goToBusinessSettings: () => go(settingsPath('Storefront')),
    goToKyc: () => go(paths.kyc),
    switchBusiness: () => { setMenuOpen(false); navigate(paths.selectBusiness, { state: { from: pathname } }) },
    openHelp: () => { setMenuOpen(false); window.location.href = 'mailto:support@syncship.africa' },
    signOut: () => {
      setMenuOpen(false)
      logout()
      queryClient.clear()
      navigate(paths.login, { replace: true })
    },
  }
}

/** Open state and actions for the "Let's get your business ready" prompt. */
export function useSetupPrompt() {
  const navigate = useNavigate()
  const wanted = useUiStore(state => state.setupPromptOpen)
  const setOpen = useUiStore(state => state.setSetupPromptOpen)
  const progress = useSetupProgress()
  // Only for businesses with something left to do, and only once progress has loaded (no flash for complete ones).
  const incomplete = !progress.isLoading && progress.completed < progress.total
  return {
    open: wanted && incomplete,
    close: () => setOpen(false),
    goToSection: (section: SettingsSection) => {
      setOpen(false)
      navigate(settingsPath(section))
    },
  }
}

/** Open state for the phone/tablet slide-in sidebar. */
export function useMobileSidebar() {
  const open = useUiStore(state => state.mobileNavOpen)
  const setOpen = useUiStore(state => state.setMobileNavOpen)
  const close = useCallback(() => setOpen(false), [setOpen])
  return { open, close, openMenu: () => setOpen(true) }
}
