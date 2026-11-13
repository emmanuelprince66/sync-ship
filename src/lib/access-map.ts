import type { AccessRule } from './sink-permissions'

/**
 * SyncShip screens and actions → sink-inventory's permission keys.
 * Same structure in SyncShip, CLIQBOOK and Payments (lib/access-map.ts); the logic is lib/sink-permissions.ts.
 *
 * How a rule is read (sink's order): the owner can do everything → the login's checklist
 * (`permissions_matrix`, "module:action", any one pair enough) → sink's on/off flag when the login has
 * flags but no checklist → the role rule (`adminLike` = OWNER / ADMIN-ATTENDANT / MANAGER).
 *
 * Role rules are the owner's stated attendant defaults (an attendant with the sink role defaults gets the
 * same). Where sink's own role rule differs it says so: those are the sink differences to confirm.
 */
export const ACCESS = {
  // ─── Items (sink: Inventory / Products) ──────────────────────────────────
  /** The Items page. sink /inventory → inventory:view or products:view. */
  items: { matrix: ['inventory:view', 'products:view'], roles: 'everyone' },
  /** Turn an item on/off for orders. Nearest sink check: inventory:view, or products:edit. */
  toggleItemAvailability: { matrix: ['inventory:view', 'products:edit'], roles: 'everyone' },
  /** Add, edit, delete, import, reprice, list on the storefront. sink Inventory edit → products:create/edit. */
  manageItems: { matrix: ['products:create', 'products:edit'], roles: 'adminLike' },

  // ─── Sales & shipments (sink: Sales / Orders / POS) ─────────────────────
  /** Sales history. sink /sales → sales:view (link flag view_orders). */
  viewSales: { matrix: ['sales:view'], flag: 'view_orders', roles: 'everyone' },
  /** Shipping & tracking list. sink /orders → orders:view (flag view_orders). */
  shipments: { matrix: ['orders:view'], flag: 'view_orders', roles: 'everyone' },
  /** Create a shipment and its payment link. sink /orders/create → orders:manage, /pos → sales:create (flag process_sales). */
  createShipments: { matrix: ['orders:manage', 'sales:create'], flag: 'process_sales', roles: 'everyone' },

  // ─── Customers (sink: Customers) ────────────────────────────────────────
  /** Customers page. sink /customers → customers:view. sink's role rule: OWNER / ADMIN-ATTENDANT / ACCOUNTANT (attendants excluded). */
  customers: { matrix: ['customers:view'], roles: 'everyone' },
  /** Add a customer. sink Customers → customers:create, fallback true. */
  addCustomers: { matrix: ['customers:create'], roles: 'everyone' },
  /** Edit a customer. sink Contact → customers:edit, fallback true. */
  editCustomers: { matrix: ['customers:edit'], roles: 'everyone' },
  /** Delete a customer. sink Contact → customers:delete, fallback isAdminLike. */
  deleteCustomers: { matrix: ['customers:delete'], roles: 'adminLike' },

  // ─── Wallet (sink: Transactions) ────────────────────────────────────────
  /** Wallet page and its transactions list. sink /transactions → banking:view or sales:view (flag view_transactions). */
  transactions: { matrix: ['banking:view', 'sales:view'], flag: 'view_transactions', roles: 'everyone' },
  /** Balance, account cards, fund, reports, add account. sink Transactions → manage_bank_details (banking:manage). */
  manageWallet: { flag: 'manage_bank_details', roles: 'adminLike' },
  /** Transfer / withdraw (inside the balance banner). sink Transactions → can_initiate_expense_transfer (expenses:transfer). */
  transfer: { flag: 'can_initiate_expense_transfer', roles: 'adminLike' },

  // ─── Setup (sink: Store / Operations / Settings) ────────────────────────
  /** Settings (storefront, shipping, Shipbubble, payments, team), KYC, setup prompt. sink /store-info, /shipping, … → settings:view. */
  setup: { matrix: ['settings:view'], roles: 'adminLike' },
  /** Team & users tab. sink Settings → staff:view (fallback isAdminLike). */
  team: { matrix: ['staff:view'], roles: 'adminLike' },
} as const satisfies Record<string, AccessRule>

export type AccessArea = keyof typeof ACCESS

/** Routes → the area that opens them. Most specific first: the first prefix that matches decides. */
export const PAGE_AREAS: readonly (readonly [string, AccessArea])[] = [
  ['/shipments/new', 'createShipments'],
  ['/shipments', 'shipments'],
  ['/items', 'items'],
  ['/customers', 'customers'],
  ['/wallet', 'transactions'],
  ['/settings', 'setup'],
  ['/kyc', 'setup'],
]

