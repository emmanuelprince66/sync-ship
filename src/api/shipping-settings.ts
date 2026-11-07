import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ApiError, apiRequest, mockDelay } from '@/lib/api-client'
import { centroidByStateName } from '@/lib/address'
import { requireBusinessId, updateBusiness, useCurrentBusiness, useCurrentBusinessId, type ShipbubbleSettings as RawShipbubbleSettings } from './business'
import { asRecord, isLive, listFrom, num, str } from './http'
import { queryKeys } from './query-keys'
import { useShippingCategories } from './shipments'
import type { ShippingCategory, BoxSize } from './types'

/**
 * Shipping setup — port of sink-inventory's useShipbubbleHook + shipping methods:
 *
 *  PATCH  business/{id}/                    { shipbubble_settings, shipping_companies } (JSON — DRF's
 *                                           nested serializer needs a real object, not multipart)
 *  PATCH  business/{id}/                    { shipbubble_settings: { is_active } } (activate / deactivate only)
 *  GET    order/shipping_category/          item categories (useShippingCategories)
 *  GET    business/shipping/{business_id}/  in-house shipping methods
 *  POST   business/shipping/{business_id}/  { location, amount, description, visible }
 *  PATCH  business/single_shipping/{id}/
 *  DELETE business/single_shipping/{id}/
 *
 * package_size (default box + max weight) comes from GET order/shipping_dimention/
 * and is sent with the settings, as in sink-inventory.
 */

export const shippingSettingsKeys = {
  methods: ['shipping-settings', 'methods'] as const,
  shipbubble: ['shipping-settings', 'shipbubble'] as const,
}

export type ShippingCompany = 'SHIPBUBBLE' | 'CHOWDECK'

export type ShipbubbleSetup = {
  street: string
  city: string
  state: string
  phone: string
  landmark: string
  category: ShippingCategory | null
  /** Default package size (sink: packageSize) — box name, image, dimensions and max weight. */
  packageSize: BoxSize | null
  /** Backend `shipbubble_settings.is_active`. */
  isActive: boolean
  /** Kept as strings end to end so a float round-trip never loses precision. Always set/cleared as a pair. */
  latitude: string
  longitude: string
}

export type ShipbubbleState = {
  settings: ShipbubbleSetup
  companies: ShippingCompany[]
  /** Full setup done — pickup street + category on file (sink-inventory's `isConfigured`). */
  isConfigured: boolean
}

export type ShippingMethod = { id: string; location: string; amount: number | null; description: string; visible: boolean; createdAt: string }
/** `amount` is the fee as typed ("" → null), the way sink-inventory sends it. */
export type ShippingMethodInput = { location: string; amount: string | null; description: string; visible: boolean }

export const EMPTY_SHIPBUBBLE: ShipbubbleSetup = { street: '', city: '', state: '', phone: '', landmark: '', category: null, packageSize: null, isActive: false, latitude: '', longitude: '' }

/** Simple state list kept for other screens (KYC, business forms). */
export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo',
  'Ekiti', 'Enugu', 'FCT - Abuja', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
]

/** Sample categories so the setup is previewable in VITE_AUTH_MODE=mock. */
const MOCK_CATEGORIES: ShippingCategory[] = [
  { id: 1, name: 'Fashion wears' }, { id: 2, name: 'Health and beauty' }, { id: 3, name: 'Electronics and gadgets' },
  { id: 4, name: 'Groceries' }, { id: 5, name: 'Home and kitchen' }, { id: 6, name: 'Documents' },
]

// ─── Mapping ────────────────────────────────────────────────────────────────

/** Hydrates from the business object (`shipbubble` or `shipbubble_settings`) — sink's hydrateFromBusiness. */
export const hydrateShipbubble = (raw: RawShipbubbleSettings | null, companies: string[]): ShipbubbleState => {
  const sb = raw ?? {}
  return {
    settings: {
      street: str(sb.street),
      city: str(sb.city),
      state: str(sb.state),
      phone: str(sb.phone),
      landmark: str(sb.landmark),
      category: sb.category ? { id: num(sb.category.category_id), name: str(sb.category.category) } : null,
      packageSize: sb.package_size
        ? { name: str(sb.package_size.name), imageUrl: str(sb.package_size.description_image_url), height: num(sb.package_size.height), width: num(sb.package_size.width), length: num(sb.package_size.length), maxWeight: num(sb.package_size.max_weight) }
        : null,
      isActive: Boolean(sb.is_active),
      // String() so a JSON number doesn't break the .trim() calls in the save path.
      latitude: sb.latitude != null ? String(sb.latitude) : '',
      longitude: sb.longitude != null ? String(sb.longitude) : '',
    },
    companies: companies.filter((company): company is ShippingCompany => company === 'SHIPBUBBLE' || company === 'CHOWDECK'),
    isConfigured: Boolean(sb.street && sb.category),
  }
}

/**
 * PATCH body — sink's buildPatchPayload. shipbubble_settings is
 * only sent once a category is picked; lat/long only when both are present (the API
 * models them as optional, not nullable).
 */
const buildPatch = (settings: ShipbubbleSetup, companies: ShippingCompany[]) => ({
  shipping_companies: companies,
  ...(settings.category
    ? {
      shipbubble_settings: {
        street: settings.street.trim(),
        city: settings.city.trim(),
        state: settings.state.trim(),
        phone: settings.phone.trim(),
        landmark: settings.landmark.trim(),
        category: { category_id: settings.category.id, category: settings.category.name },
        ...(settings.packageSize
          ? { package_size: { name: settings.packageSize.name, description_image_url: settings.packageSize.imageUrl, height: settings.packageSize.height, width: settings.packageSize.width, length: settings.packageSize.length, max_weight: settings.packageSize.maxWeight } }
          : {}),
        is_active: settings.isActive,
        ...(settings.latitude.trim() && settings.longitude.trim() ? { latitude: settings.latitude.trim(), longitude: settings.longitude.trim() } : {}),
      },
    }
    : {}),
})

const mapMethod = (value: unknown): ShippingMethod => {
  const record = asRecord(value)
  const amount = record.amount === null || record.amount === undefined || record.amount === '' ? null : num(record.amount)
  return { id: str(record.id), location: str(record.location), amount, description: str(record.description), visible: record.visible === true, createdAt: str(record.created_at) }
}

/** sink-inventory's error toast order: details.message → error → message → fallback. */
export const shippingErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof ApiError) {
    const data = asRecord(error.data)
    const details = asRecord(data.details)
    return str(details.message) || str(data.error) || error.message || fallback
  }
  return error instanceof Error && error.message ? error.message : fallback
}

const responseMessage = (data: unknown) => str(asRecord(data).message)

// ─── Sample data (mock mode only) ───────────────────────────────────────────

const mock: { shipbubble: ShipbubbleState; methods: ShippingMethod[] } = {
  shipbubble: { settings: { ...EMPTY_SHIPBUBBLE }, companies: [], isConfigured: false },
  methods: [
    { id: 'm1', location: 'Lagos Island', amount: 2500, description: 'Same-day delivery for orders before 2pm', visible: true, createdAt: '2025-08-20' },
    { id: 'm2', location: 'Store pickup', amount: null, description: 'Collect from our store', visible: false, createdAt: '2025-08-21' },
  ],
}

// ─── Services ───────────────────────────────────────────────────────────────

export type SaveShipbubbleInput = { settings: ShipbubbleSetup; companies: ShippingCompany[] }

const saveShipbubble = async ({ settings, companies }: SaveShipbubbleInput) => {
  // Last-resort coordinates: the city's centroid (kilometre-level), which is enough for
  // Shipbubble's serviceability and zone banding. Same fallback as sink-inventory.
  let effective = settings
  if (!effective.latitude || !effective.longitude) {
    const centroid = centroidByStateName(effective.state, effective.city)
    if (centroid) effective = { ...effective, ...centroid }
  }
  if (!isLive()) {
    mock.shipbubble = { settings: effective, companies, isConfigured: Boolean(effective.street && effective.category) }
    return mockDelay(null, 600)
  }
  return updateBusiness(buildPatch(effective, companies))
}

/** Activate/deactivate sends only the flag — the backend keeps the rest of the saved config. */
const setShipbubbleActive = async (isActive: boolean) => {
  if (!isLive()) {
    mock.shipbubble = { ...mock.shipbubble, settings: { ...mock.shipbubble.settings, isActive } }
    return mockDelay(null, 400)
  }
  return updateBusiness({ shipbubble_settings: { is_active: isActive } })
}

const getMethods = async (businessId: string | null) => {
  if (!isLive()) return mockDelay([...mock.methods])
  const response = await apiRequest<unknown>(`business/shipping/${businessId}/`)
  return listFrom(response, ['results', 'data', 'results.data']).map(mapMethod)
}

const saveMethod = async ({ id, input }: { id?: string; input: ShippingMethodInput }) => {
  if (!isLive()) {
    const amount = input.amount === null ? null : Number(input.amount)
    const method: ShippingMethod = { id: id ?? `m${Date.now()}`, location: input.location, description: input.description, visible: input.visible, amount, createdAt: new Date().toISOString() }
    mock.methods = id ? mock.methods.map(current => (current.id === id ? { ...current, ...method, id } : current)) : [...mock.methods, method]
    return mockDelay({ message: '' }, 500)
  }
  return id
    ? apiRequest<unknown>(`business/single_shipping/${id}/`, { method: 'PATCH', body: input })
    : apiRequest<unknown>(`business/shipping/${requireBusinessId()}/`, { method: 'POST', body: input })
}

const deleteMethod = async (id: string) => {
  if (!isLive()) {
    mock.methods = mock.methods.filter(method => method.id !== id)
    return mockDelay(null, 400)
  }
  return apiRequest<unknown>(`business/single_shipping/${id}/`, { method: 'DELETE' })
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

/** Saved Shipbubble connection, hydrated from the current business. */
export const useShipbubbleSettings = () => {
  const business = useCurrentBusiness()
  const mockQuery = useQuery({ queryKey: [...shippingSettingsKeys.shipbubble, 'mock'], queryFn: () => mockDelay(structuredClone(mock.shipbubble)), enabled: !isLive() })
  if (!isLive()) return { data: mockQuery.data, isLoading: mockQuery.isLoading }
  const data = business.data ? hydrateShipbubble(business.data.shipbubble, business.data.shippingCompanies) : undefined
  return { data, isLoading: business.isLoading }
}

/** Shipbubble item categories (sample list in mock mode). */
export const useShipbubbleCategories = () => {
  const categories = useShippingCategories()
  return isLive()
    ? { categories: categories.data ?? [], isLoading: categories.isLoading }
    : { categories: MOCK_CATEGORIES, isLoading: false }
}

const useInvalidateShipbubble = () => {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.business })
    queryClient.invalidateQueries({ queryKey: queryKeys.settings })
    queryClient.invalidateQueries({ queryKey: shippingSettingsKeys.shipbubble })
  }
}

/** Every Shipbubble update toasts like sink-inventory's useUpdateBusinessShipbubbleMutation. */
const shipbubbleToasts = {
  onSuccess: () => { toast.success('Shipbubble settings updated successfully.') },
  onError: (error: unknown) => { toast.error(shippingErrorMessage(error, 'Error updating Shipbubble settings')) },
}

export const useSaveShipbubble = () => {
  const invalidate = useInvalidateShipbubble()
  return useMutation({ mutationFn: saveShipbubble, onSuccess: () => { invalidate(); shipbubbleToasts.onSuccess() }, onError: shipbubbleToasts.onError })
}

export const useSetShipbubbleActive = () => {
  const invalidate = useInvalidateShipbubble()
  return useMutation({ mutationFn: setShipbubbleActive, onSuccess: () => { invalidate(); shipbubbleToasts.onSuccess() }, onError: shipbubbleToasts.onError })
}

export const useShippingMethods = () => {
  const { businessId } = useCurrentBusinessId()
  return useQuery({
    queryKey: [...shippingSettingsKeys.methods, isLive() ? businessId : 'mock'],
    queryFn: () => getMethods(businessId),
    enabled: !isLive() || Boolean(businessId),
  })
}

const useInvalidateMethods = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: shippingSettingsKeys.methods })
}

export const useSaveShippingMethod = () => {
  const invalidate = useInvalidateMethods()
  return useMutation({
    mutationFn: saveMethod,
    onSuccess: (data, { id }) => {
      invalidate()
      toast.success(responseMessage(data) || (id ? 'Shipping method updated successfully' : 'Shipping method created successfully'))
    },
    onError: (error, { id }) => { toast.error(shippingErrorMessage(error, id ? 'Failed to update shipping method' : 'Failed to create shipping method')) },
  })
}

export const useDeleteShippingMethod = () => {
  const invalidate = useInvalidateMethods()
  return useMutation({
    mutationFn: deleteMethod,
    onSuccess: () => { invalidate(); toast.success('Shipping deleted successfully') },
    onError: error => { toast.error(shippingErrorMessage(error, 'Error deleting Shipping')) },
  })
}
