import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest, mockDelay } from '@/lib/api-client'
import { fetchCurrentBusiness, requireBusinessId, useCurrentBusinessId, type Business } from './business'
import { asRecord, isLive, listFrom, num, str } from './http'
import { db } from './mock-data'
import { queryKeys } from './query-keys'
import { getStoreUrl } from './storefront-settings'
import type { BusinessSettings, Employee, EmployeeRole, InviteEmployeeInput, StaffRole } from './types'

/**
 * Settings read from the live business (GET business/{id}/). Groups the backend
 * has no field for start empty in live mode, never with sample values.
 *
 * Staff (Team & users) uses sink-inventory's attendant endpoints:
 *  GET    business/list_attendants/{business_id}/
 *  POST   business/add_attendant/{business_id}/   { firstname, lastname, phone, role }
 *  DELETE business/single_attendant/{id}/
 */

/** Roles a business can give staff, labelled and described as in sink-inventory. */
export const STAFF_ROLES: { value: StaffRole; label: string; description: string }[] = [
  { value: 'ATTENDANT', label: 'Attendant', description: 'Records sales and creates shipments.' },
  { value: 'ADMIN-ATTENDANT', label: 'Admin attendant', description: 'Manages staff, customers and day-to-day operations.' },
  { value: 'INVENTORY-MANAGER', label: 'Inventory manager', description: 'Manages items, stock and pricing.' },
  { value: 'ACCOUNTANT', label: 'Accountant', description: 'Sees transactions, expenses and payouts.' },
  { value: 'PHARMACIST', label: 'Pharmacist', description: 'Dispenses and manages pharmacy stock.' },
  { value: 'PRODUCTION-MANAGER', label: 'Production manager', description: 'Handles production inventory and quality.' },
]

export const roleLabel = (role: string) =>
  role === 'OWNER' ? 'Owner' : STAFF_ROLES.find(item => item.value === role)?.label ?? (role ? role.charAt(0) + role.slice(1).toLowerCase().replace(/-/g, ' ') : 'Staff')

/** Live baseline: nothing pre-filled. Real business values are merged over it. */
const emptySettings = (): BusinessSettings => ({
  storeUrl: '',
  storefront: { name: '', phone: '', whatsapp: '', email: '', analytics: false, active: false },
  shipping: { business: '', contact: '', phone: '', location: '', category: '', defaultKg: '', active: false },
  payments: { online: false, wallet: false, kyc: false, bank: '', account: '' },
  channels: { email: false, sms: false, whatsapp: false, order: false, payout: false },
})

const mergeBusiness = (business: Business, base: BusinessSettings): BusinessSettings => {
  const sb = business.shipbubble
  const raw = business.raw
  const pickup = sb ? [sb.street, sb.city, sb.state].filter(Boolean).join(', ') : ''
  return {
    ...base,
    // The API returns only the slug; this is the public address customers open.
    storeUrl: business.storeUrl ? getStoreUrl({ storeSlug: business.storeUrl, customDomain: str(raw.custom_domain), customDomainApproved: raw.custom_domain_approved === true }, 'OUTSTORE') : base.storeUrl,
    storefront: {
      ...base.storefront,
      name: business.name || base.storefront.name,
      phone: business.phone || base.storefront.phone,
      whatsapp: str(raw.whatsapp_number) || str(raw.whatsapp) || base.storefront.whatsapp,
      email: business.email || base.storefront.email,
    },
    shipping: {
      ...base.shipping,
      business: business.name || base.shipping.business,
      contact: business.owner || base.shipping.contact,
      phone: str(sb?.phone) || business.phone || base.shipping.phone,
      location: pickup || [business.street, business.city, business.state].filter(Boolean).join(', ') || base.shipping.location,
      category: sb?.category?.category || base.shipping.category,
      defaultKg: sb?.package_size ? String(num(sb.package_size.max_weight)) : base.shipping.defaultKg,
      active: sb ? Boolean(sb.is_active) : base.shipping.active,
    },
    payments: {
      ...base.payments,
      online: raw.allow_online_payment === true,
      kyc: raw.kyc === true,
      wallet: business.banks.length > 0,
    },
  }
}

const getSettings = async () =>
  isLive() ? mergeBusiness(await fetchCurrentBusiness(), emptySettings()) : mockDelay(structuredClone(db.settings))

/** Saves sample-only groups in mock mode. Live writes go through the dedicated APIs (storefront, banks, shipping, KYC). */
const saveSettings = (patch: Partial<Omit<BusinessSettings, 'storeUrl'>>) => {
  if (isLive()) return Promise.resolve(null)
  db.settings = { ...db.settings, ...patch }
  return mockDelay(structuredClone(db.settings), 500)
}

// ─── Staff ──────────────────────────────────────────────────────────────────

const mapEmployee = (value: unknown): Employee => {
  const record = asRecord(value)
  const user = asRecord(record.user)
  const pick = (key: string) => str(record[key]) || str(user[key])
  const name = pick('name') || [pick('firstname'), pick('lastname')].filter(Boolean).join(' ') || pick('email') || 'Staff member'
  const role = (pick('role') || 'ATTENDANT').toUpperCase() as EmployeeRole
  const inactive = record.is_active === false || user.is_active === false
  return { id: str(record.id) || str(user.id), name, email: pick('email'), phone: pick('phone'), role, roleLabel: roleLabel(role), status: inactive ? 'Inactive' : 'Active' }
}

const getEmployees = async (businessId: string | null): Promise<Employee[]> => {
  if (!isLive()) return mockDelay([...db.employees])
  const response = await apiRequest<unknown>(`business/list_attendants/${businessId}/`)
  return listFrom(response, ['results', 'data', 'results.data', 'attendants']).map(mapEmployee)
}

const inviteEmployee = async (input: InviteEmployeeInput) => {
  if (!isLive()) {
    const employee: Employee = { id: `emp-${Date.now()}`, name: `${input.firstname} ${input.lastname}`.trim(), email: '', phone: input.phone, role: input.role, roleLabel: roleLabel(input.role), status: 'Active' }
    db.employees = [...db.employees, employee]
    return mockDelay(employee, 500)
  }
  return apiRequest<unknown>(`business/add_attendant/${requireBusinessId()}/`, { method: 'POST', body: input })
}

const removeEmployee = async (id: string) => {
  if (!isLive()) {
    db.employees = db.employees.filter(employee => employee.id !== id)
    return mockDelay(null, 400)
  }
  return apiRequest<unknown>(`business/single_attendant/${id}/`, { method: 'DELETE' })
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

const useSettingsKey = () => {
  const { businessId } = useCurrentBusinessId()
  return { key: [...queryKeys.settings, isLive() ? businessId : 'mock'] as const, businessId }
}

export const useBusinessSettings = () => {
  const { key, businessId } = useSettingsKey()
  return useQuery({ queryKey: key, queryFn: getSettings, enabled: !isLive() || Boolean(businessId) })
}

export const useSaveSettings = () => {
  const queryClient = useQueryClient()
  const { key } = useSettingsKey()
  return useMutation({
    mutationFn: saveSettings,
    onSuccess: (saved, patch) => queryClient.setQueryData<BusinessSettings>(key, current => (current ? { ...current, ...patch } : saved ?? current)),
  })
}

export const useEmployees = () => {
  const { businessId } = useCurrentBusinessId()
  return useQuery({
    queryKey: [...queryKeys.employees, isLive() ? businessId : 'mock'],
    queryFn: () => getEmployees(businessId),
    enabled: !isLive() || Boolean(businessId),
  })
}

const useStaffMutation = <TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) => {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn, onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.employees }) })
}

export const useInviteEmployee = () => useStaffMutation(inviteEmployee)
export const useRemoveEmployee = () => useStaffMutation(removeEmployee)
