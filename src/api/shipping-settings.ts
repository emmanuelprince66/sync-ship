import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest, mockDelay } from '@/lib/api-client'
import { requireBusinessId, updateBusiness, useCurrentBusiness, useCurrentBusinessId, type ShipbubbleSettings as RawShipbubbleSettings } from './business'
import { asRecord, isLive, listFrom, num, str } from './http'
import { queryKeys } from './query-keys'
import { useBoxSizes, useShippingCategories } from './shipments'
import type { BoxSize, ShippingCategory } from './types'

/**
 * Shipping setup — same backend as sink-inventory's Settings › Shipping:
 *
 *  PATCH  business/{id}/                    { shipbubble_settings, shipping_companies } (JSON)
 *  GET    business/shipping/{business_id}/  in-house delivery zones ("shipping methods")
 *  POST   business/shipping/{business_id}/  { location, amount, description }
 *  PATCH  business/single_shipping/{id}/
 *  DELETE business/single_shipping/{id}/
 * Box presets and categories come from useBoxSizes / useShippingCategories (shipments.ts).
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
  packageSize: BoxSize | null
  isActive: boolean
  latitude: string
  longitude: string
}

export type ShipbubbleState = {
  settings: ShipbubbleSetup
  companies: ShippingCompany[]
  /** Pickup address + category on file — the connection has been configured at least once. */
  isConfigured: boolean
}

export type ShippingMethod = { id: string; location: string; amount: number | null; description: string; visible: boolean; createdAt: string }
export type ShippingMethodInput = { location: string; amount: number | null; description: string }

export const EMPTY_SHIPBUBBLE: ShipbubbleSetup = { street: '', city: '', state: '', phone: '', landmark: '', category: null, packageSize: null, isActive: false, latitude: '', longitude: '' }

// ─── Reference data ─────────────────────────────────────────────────────────

/** Approximate state-capital coordinates. Used when no exact pickup pin is set (Shipbubble needs one). */
const STATE_CENTROIDS: Record<string, [number, number]> = {
  'Abia': [5.5320, 7.4860], 'Adamawa': [9.2035, 12.4954], 'Akwa Ibom': [5.0377, 7.9128], 'Anambra': [6.2104, 7.0741],
  'Bauchi': [10.3158, 9.8442], 'Bayelsa': [4.9267, 6.2676], 'Benue': [7.7337, 8.5214], 'Borno': [11.8311, 13.1510],
  'Cross River': [4.9757, 8.3417], 'Delta': [6.2059, 6.6959], 'Ebonyi': [6.3249, 8.1137], 'Edo': [6.3350, 5.6037],
  'Ekiti': [7.6211, 5.2210], 'Enugu': [6.4584, 7.5464], 'FCT - Abuja': [9.0765, 7.3986], 'Gombe': [10.2897, 11.1673],
  'Imo': [5.4840, 7.0351], 'Jigawa': [11.7564, 9.3388], 'Kaduna': [10.5105, 7.4165], 'Kano': [12.0022, 8.5920],
  'Katsina': [12.9908, 7.6018], 'Kebbi': [12.4539, 4.1975], 'Kogi': [7.8023, 6.7333], 'Kwara': [8.4966, 4.5426],
  'Lagos': [6.5244, 3.3792], 'Nasarawa': [8.4939, 8.5150], 'Niger': [9.6139, 6.5569], 'Ogun': [7.1475, 3.3619],
  'Ondo': [7.2571, 5.2058], 'Osun': [7.7827, 4.5418], 'Oyo': [7.3775, 3.9470], 'Plateau': [9.8965, 8.8583],
  'Rivers': [4.8156, 7.0498], 'Sokoto': [13.0059, 5.2476], 'Taraba': [8.8937, 11.3596], 'Yobe': [11.7470, 11.9608],
  'Zamfara': [12.1628, 6.6614],
}

export const NIGERIAN_STATES = Object.keys(STATE_CENTROIDS)

const centroidFor = (state: string) => {
  const match = Object.entries(STATE_CENTROIDS).find(([name]) => name.toLowerCase() === state.trim().toLowerCase() || (state.toLowerCase().includes('abuja') && name === 'FCT - Abuja'))
  return match ? { latitude: match[1][0].toFixed(6), longitude: match[1][1].toFixed(6) } : null
}

/** Sample presets so the setup screen is previewable in VITE_AUTH_MODE=mock. */
const MOCK_BOX_SIZES: BoxSize[] = [
  { name: 'Envelope', imageUrl: '', length: 33, width: 25, height: 2, maxWeight: 0.5 },
  { name: 'Flyer', imageUrl: '', length: 40, width: 30, height: 5, maxWeight: 2 },
  { name: 'Small box', imageUrl: '', length: 30, width: 20, height: 15, maxWeight: 5 },
  { name: 'Medium box', imageUrl: '', length: 40, width: 30, height: 25, maxWeight: 10 },
  { name: 'Large box', imageUrl: '', length: 60, width: 40, height: 40, maxWeight: 20 },
]
const MOCK_CATEGORIES: ShippingCategory[] = [
  { id: 1, name: 'Fashion wears' }, { id: 2, name: 'Health and beauty' }, { id: 3, name: 'Electronics and gadgets' },
  { id: 4, name: 'Groceries' }, { id: 5, name: 'Home and kitchen' }, { id: 6, name: 'Documents' },
]

// ─── Mapping ────────────────────────────────────────────────────────────────

const toBoxSize = (raw: RawShipbubbleSettings['package_size']): BoxSize | null =>
  raw ? { name: str(raw.name), imageUrl: str(raw.description_image_url), height: num(raw.height), width: num(raw.width), length: num(raw.length), maxWeight: num(raw.max_weight) } : null

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
      packageSize: toBoxSize(sb.package_size),
      isActive: Boolean(sb.is_active),
      latitude: str(sb.latitude),
      longitude: str(sb.longitude),
    },
    companies: companies.filter((company): company is ShippingCompany => company === 'SHIPBUBBLE' || company === 'CHOWDECK'),
    isConfigured: Boolean(sb.street && sb.category),
  }
}

/** PATCH body, field-for-field what sink-inventory sends. Coordinates fall back to the state centroid. */
const buildPatch = (settings: ShipbubbleSetup, companies: ShippingCompany[]) => {
  const coordinates = settings.latitude.trim() && settings.longitude.trim()
    ? { latitude: settings.latitude.trim(), longitude: settings.longitude.trim() }
    : centroidFor(settings.state)
  return {
    shipping_companies: companies,
    ...(settings.category && settings.packageSize
      ? {
        shipbubble_settings: {
          street: settings.street.trim(),
          city: settings.city.trim(),
          state: settings.state.trim(),
          phone: settings.phone.trim(),
          landmark: settings.landmark.trim(),
          category: { category_id: settings.category.id, category: settings.category.name },
          package_size: {
            name: settings.packageSize.name,
            description_image_url: settings.packageSize.imageUrl,
            height: settings.packageSize.height,
            width: settings.packageSize.width,
            length: settings.packageSize.length,
            max_weight: settings.packageSize.maxWeight,
          },
          is_active: settings.isActive,
          ...(coordinates ?? {}),
        },
      }
      : {}),
  }
}

const mapMethod = (value: unknown): ShippingMethod => {
  const record = asRecord(value)
  const amount = record.amount === null || record.amount === undefined || record.amount === '' ? null : num(record.amount)
  return { id: str(record.id), location: str(record.location), amount, description: str(record.description), visible: record.visible !== false, createdAt: str(record.created_at) }
}

// ─── Sample data ────────────────────────────────────────────────────────────

const mock: { shipbubble: ShipbubbleState; methods: ShippingMethod[] } = {
  shipbubble: {
    settings: { ...EMPTY_SHIPBUBBLE, street: '22 Awolowo Road', city: 'Ikoyi', state: 'Lagos', phone: '0802 400 1294' },
    companies: [],
    isConfigured: false,
  },
  methods: [
    { id: 'm1', location: 'Lagos Island', amount: 2500, description: 'Same-day delivery for orders before 2pm', visible: true, createdAt: '2025-08-20' },
    { id: 'm2', location: 'Lagos Mainland', amount: 3500, description: 'Next-day delivery', visible: true, createdAt: '2025-08-20' },
    { id: 'm3', location: 'Store pickup', amount: null, description: 'Collect from 22 Awolowo Road, Ikoyi', visible: true, createdAt: '2025-08-21' },
  ],
}

// ─── Services ───────────────────────────────────────────────────────────────

const saveShipbubble = async ({ settings, companies }: { settings: ShipbubbleSetup; companies: ShippingCompany[] }) => {
  if (!isLive()) {
    mock.shipbubble = { settings, companies, isConfigured: Boolean(settings.street && settings.category) }
    return mockDelay(null, 600)
  }
  return updateBusiness(buildPatch(settings, companies))
}

/** Toggle only — sends just { shipbubble_settings: { is_active } }, like sink-inventory. */
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
    const method: ShippingMethod = { id: id ?? `m${Date.now()}`, ...input, visible: true, createdAt: new Date().toISOString() }
    mock.methods = id ? mock.methods.map(current => (current.id === id ? { ...current, ...input } : current)) : [...mock.methods, method]
    return mockDelay(method, 500)
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

/** Saved Shipbubble connection for the current business. */
export const useShipbubbleSettings = () => {
  const business = useCurrentBusiness()
  const mockQuery = useQuery({ queryKey: [...shippingSettingsKeys.shipbubble, 'mock'], queryFn: () => mockDelay(structuredClone(mock.shipbubble)), enabled: !isLive() })
  if (!isLive()) return { data: mockQuery.data, isLoading: mockQuery.isLoading }
  const data = business.data ? hydrateShipbubble(business.data.shipbubble, business.data.shippingCompanies) : undefined
  return { data, isLoading: business.isLoading }
}

/** Box presets + item categories for the setup form (sample lists in mock mode). */
export const useShipbubbleOptions = () => {
  const boxSizes = useBoxSizes()
  const categories = useShippingCategories()
  const live = isLive()
  return {
    boxSizes: live ? boxSizes.data ?? [] : MOCK_BOX_SIZES,
    categories: live ? categories.data ?? [] : MOCK_CATEGORIES,
    isLoading: live && (boxSizes.isLoading || categories.isLoading),
  }
}

const useInvalidateShipbubble = () => {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.business })
    queryClient.invalidateQueries({ queryKey: queryKeys.settings })
    queryClient.invalidateQueries({ queryKey: shippingSettingsKeys.shipbubble })
  }
}

export const useSaveShipbubble = () => {
  const invalidate = useInvalidateShipbubble()
  return useMutation({ mutationFn: saveShipbubble, onSuccess: invalidate })
}

export const useSetShipbubbleActive = () => {
  const invalidate = useInvalidateShipbubble()
  return useMutation({ mutationFn: setShipbubbleActive, onSuccess: invalidate })
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
  return useMutation({ mutationFn: saveMethod, onSuccess: invalidate })
}

export const useDeleteShippingMethod = () => {
  const invalidate = useInvalidateMethods()
  return useMutation({ mutationFn: deleteMethod, onSuccess: invalidate })
}
