import { ACCESS, PAGE_AREAS, type AccessArea } from '@/lib/access-map'
import { allows, ruleForPath, type AccessSubject } from '@/lib/sink-permissions'

/** Sync360 user roles (same set as sink-inventory's lib/store/types.ts). */
export type UserRole =
  | 'OWNER'
  | 'ADMIN-ATTENDANT'
  | 'MANAGER'
  | 'ATTENDANT'
  | 'PHARMACIST'
  | 'PRODUCTION-MANAGER'
  | 'ACCOUNTANT'
  | 'INVENTORY-MANAGER'

/** Only owners can create businesses (sink shows "Add Business" to OWNER only). */
export const canCreateBusiness = (role: UserRole | undefined) => !role || role === 'OWNER'

/**
 * SyncShip's two access levels, for labels and the Team form. What each login may actually do is decided
 * per screen from its permissions, as sink-inventory decides (lib/access-map.ts, lib/sink-permissions.ts).
 * Super admins: the owner, the admin attendant and a manager (sink's isAdminLike). A session without a
 * role is an owner's: sign-ups and older sessions carry none (as `canCreateBusiness` assumes).
 */
export const SUPER_ADMIN_ROLES: readonly string[] = ['OWNER', 'ADMIN-ATTENDANT', 'MANAGER']

export type AccessLevel = 'superAdmin' | 'attendant'

export const accessLevelFor = (role: string | undefined): AccessLevel =>
  !role || SUPER_ADMIN_ROLES.includes(role.trim().toUpperCase()) ? 'superAdmin' : 'attendant'

/** What this login may do in SyncShip: sink's checks (owner bypass → checklist → flag → role rule) per area. */
export const permissionsFor = (subject: AccessSubject) => {
  const level = accessLevelFor(subject.role ?? undefined)
  const can = (area: AccessArea) => allows(ACCESS[area], subject)
  return {
    accessLevel: level,
    isSuperAdmin: level === 'superAdmin',
    isAttendant: level !== 'superAdmin',
    /** Whether a route may be opened (PAGE_AREAS; routes without an area are open to every signed-in user). */
    canOpen: (path: string) => { const area = ruleForPath(path, PAGE_AREAS); return area ? can(area) : true },
    canViewItems: can('items'),
    canToggleItemAvailability: can('toggleItemAvailability'),
    /** Add, edit, delete, import and reprice items; list them on the storefront. */
    canManageItems: can('manageItems'),
    canViewSales: can('viewSales'),
    canViewShipments: can('shipments'),
    canCreateShipments: can('createShipments'),
    canViewCustomers: can('customers'),
    canManageCustomers: can('addCustomers'),
    canEditCustomers: can('editCustomers'),
    canDeleteCustomers: can('deleteCustomers'),
    canViewTransactions: can('transactions'),
    /** Wallet balances, account cards, fund, reports, add account. */
    canManageWallet: can('manageWallet'),
    /** Transfer / withdraw from the wallet (shown with the balance, as in sink). */
    canTransfer: can('manageWallet') && can('transfer'),
    /** Settings (storefront, shipping, Shipbubble, payments, team), KYC and business setup. */
    canManageSetup: can('setup'),
    canManageTeam: can('setup') && can('team'),
  }
}

export type Permissions = ReturnType<typeof permissionsFor>
