import { City, State } from 'country-state-city'
import { env } from '@/config/env'

/**
 * Address lookup for the Shipbubble pickup point — a port of sink-inventory's
 * utils/address.ts + lib/geoapify.ts + lib/addressContract.ts.
 *
 * sink-inventory proxies Geoapify through its Next.js server (/api/address*).
 * This app has no server, so it calls Geoapify directly with a browser key
 * (VITE_GEOAPIFY_KEY — restrict it to your domains in the Geoapify dashboard).
 * Same request parameters, same response mapping. With no key set, lookup is
 * reported as disabled and the form falls back to the state/city pickers plus
 * city-centroid coordinates, exactly like sink-inventory with GEOAPIFY_KEY unset.
 *
 * Coordinate resolution order (unchanged from sink-inventory):
 *   1. coordinates from a picked suggestion or GPS fix  (street-level)
 *   2. coordinates already stored on the record
 *   3. city centroid from country-state-city            (kilometre-level)
 *   4. nothing — omit the fields entirely
 */

export type AddressSuggestion = {
  id: string
  /** Full human-readable line — what the dropdown row shows. */
  label: string
  /** Street line only — what goes into the street field. */
  address: string
  city: string
  state: string
  /** ISO subdivision code, e.g. "LA". May be "". */
  stateCode: string
  country: string
  latitude: string
  longitude: string
  precision: string
  secondary?: string
}

export type Coordinates = { latitude: string; longitude: string }

type LookupResult = { success: boolean; data: AddressSuggestion[]; disabled?: boolean; message?: string }

const GEOAPIFY_AUTOCOMPLETE = 'https://api.geoapify.com/v1/geocode/autocomplete'
const GEOAPIFY_REVERSE = 'https://api.geoapify.com/v1/geocode/reverse'
/** Shipbubble is Nigeria-only. Unfiltered, "Allen Avenue" returns Texas. */
const COUNTRY_FILTER = 'countrycode:ng'

export const isAddressLookupEnabled = () => Boolean(env.geoapifyKey)

// ─── Mapping (lib/geoapify.ts) ──────────────────────────────────────────────

type GeoProperties = {
  lat?: number; lon?: number; housenumber?: string; street?: string; address_line1?: string; name?: string
  city?: string; town?: string; village?: string; suburb?: string; state?: string; state_code?: string
  country?: string; formatted?: string; result_type?: string; place_id?: string
}
type GeoFeature = { id?: string; properties?: GeoProperties; geometry?: { coordinates?: [number, number] } }

export const toFixed6 = (value: unknown) => {
  const num = Number(value)
  return Number.isFinite(num) ? num.toFixed(6) : ''
}

/** Providers return "Lagos" or "Lagos State"; country-state-city only knows the bare form. */
const normalizeStateName = (name?: string) => (name || '').replace(/\s+state$/i, '').trim()
const normalizeStateCode = (code?: string) => (code || '').replace(/^NG-/i, '').toUpperCase()

/** Geoapify splits the street across housenumber/street and files towns under city/town/village/suburb. */
const streetLine = (p: GeoProperties) => [p.housenumber, p.street].filter(Boolean).join(' ') || p.address_line1 || p.name || ''
const cityOf = (p: GeoProperties) => p.city || p.town || p.village || p.suburb || ''

/** One feature → one suggestion; null without coordinates (they're the point of the lookup). */
const suggestionFromFeature = (feature: GeoFeature, index: number): AddressSuggestion | null => {
  const p = feature.properties ?? {}
  const latitude = toFixed6(p.lat ?? feature.geometry?.coordinates?.[1])
  const longitude = toFixed6(p.lon ?? feature.geometry?.coordinates?.[0])
  if (!latitude || !longitude) return null
  const street = streetLine(p)
  return {
    id: String(p.place_id || feature.id || index),
    label: p.formatted || street,
    address: street,
    city: cityOf(p),
    state: normalizeStateName(p.state),
    stateCode: normalizeStateCode(p.state_code),
    country: p.country || 'Nigeria',
    latitude,
    longitude,
    precision: p.result_type || '',
  }
}

const geoapifyError = (data: { message?: string; error?: string } | null, fallback: string) => data?.message || data?.error || fallback

// ─── Lookups (utils/address.ts) ─────────────────────────────────────────────

export const fetchAddressSuggestions = async (query: string, opts?: { limit?: number; proximity?: Coordinates | null }): Promise<LookupResult> => {
  const q = (query || '').trim()
  if (q.length < 3) return { success: true, data: [] }
  if (!env.geoapifyKey) return { success: true, disabled: true, data: [], message: 'Address lookup is not configured (VITE_GEOAPIFY_KEY is unset)' }

  const url = new URL(GEOAPIFY_AUTOCOMPLETE)
  url.searchParams.set('text', q)
  url.searchParams.set('apiKey', env.geoapifyKey)
  url.searchParams.set('lang', 'en')
  url.searchParams.set('limit', String(opts?.limit ?? 6))
  url.searchParams.set('filter', COUNTRY_FILTER)
  const proximity = opts?.proximity?.latitude && opts.proximity.longitude ? `${opts.proximity.longitude},${opts.proximity.latitude}` : ''
  url.searchParams.set('bias', proximity ? `proximity:${proximity}|${COUNTRY_FILTER}` : COUNTRY_FILTER)

  try {
    const response = await fetch(url.toString())
    const data = await response.json().catch(() => null) as { features?: GeoFeature[]; message?: string; error?: string } | null
    if (!response.ok) return { success: false, data: [], message: geoapifyError(data, 'Address lookup failed') }
    const features = Array.isArray(data?.features) ? data.features : []
    return { success: true, data: features.map(suggestionFromFeature).filter((s): s is AddressSuggestion => s !== null) }
  } catch {
    return { success: false, data: [], message: 'Address lookup failed' }
  }
}

/** GPS fix → readable address. Null on no match, no key or any failure — never an error worth showing. */
export const fetchAddressFromCoordinates = async (latitude: number, longitude: number): Promise<AddressSuggestion | null> => {
  if (!env.geoapifyKey) return null
  const url = new URL(GEOAPIFY_REVERSE)
  url.searchParams.set('lat', String(latitude))
  url.searchParams.set('lon', String(longitude))
  url.searchParams.set('apiKey', env.geoapifyKey)
  url.searchParams.set('lang', 'en')
  url.searchParams.set('limit', '1')
  try {
    const response = await fetch(url.toString())
    if (!response.ok) return null
    const data = await response.json().catch(() => null) as { features?: GeoFeature[] } | null
    const feature = Array.isArray(data?.features) ? data.features[0] : undefined
    if (!feature) return null
    const p = feature.properties ?? {}
    const street = streetLine(p)
    // The device's own fix is echoed back, not the provider's snapped centroid.
    return {
      id: String(p.place_id || feature.id || 'reverse'),
      label: p.formatted || street,
      address: street,
      city: cityOf(p),
      state: normalizeStateName(p.state),
      stateCode: normalizeStateCode(p.state_code),
      country: p.country || 'Nigeria',
      latitude: toFixed6(latitude),
      longitude: toFixed6(longitude),
      precision: p.result_type || '',
    }
  } catch {
    return null
  }
}

/**
 * Forward-geocodes an address typed field by field. Only a result inside the
 * given state counts — a same-named street in another state would misroute riders.
 */
export const geocodeAddress = async (street: string, city: string, state: string, stateIso?: string): Promise<AddressSuggestion | null> => {
  const bareState = (name: string) => name.replace(/\s+state$/i, '').trim().toLowerCase()
  try {
    const res = await fetchAddressSuggestions([street, city, state].filter(part => part.trim()).join(', '), { limit: 5 })
    const inState = (s: AddressSuggestion) => bareState(s.state || '') === bareState(state) || (!!stateIso && s.stateCode === stateIso)
    const match = res.data.find(inState)
    return match?.latitude && match.longitude ? match : null
  } catch {
    return null
  }
}

// ─── Nigerian states / cities + centroid fallback ───────────────────────────

/** Canonical names the backend's address validator accepts (country-state-city). */
export const NG_STATES = State.getStatesOfCountry('NG')

export const stateIsoFor = (stateName: string) => NG_STATES.find(state => state.name === stateName)?.isoCode ?? ''

export const citiesOfState = (stateIso: string) => (stateIso ? City.getCitiesOfState('NG', stateIso) : [])

const asCoordinates = (latitude: unknown, longitude: unknown): Coordinates | null => {
  const lat = toFixed6(latitude)
  const lng = toFixed6(longitude)
  // Both or neither — the backend treats them as an optional pair, not nullable fields.
  return lat && lng ? { latitude: lat, longitude: lng } : null
}

/** Centroid for a Nigerian city, falling back to its state's centroid. */
export const cityCentroid = (stateIso?: string | null, cityName?: string | null): Coordinates | null => {
  if (!stateIso) return null
  if (cityName) {
    const match = City.getCitiesOfState('NG', stateIso).find(city => city.name.toLowerCase() === cityName.trim().toLowerCase())
    const coords = asCoordinates(match?.latitude, match?.longitude)
    if (coords) return coords
  }
  const state = State.getStateByCodeAndCountry(stateIso, 'NG')
  return asCoordinates(state?.latitude, state?.longitude)
}

/** Same as cityCentroid, keyed on the full state name ("Lagos"). */
export const centroidByStateName = (stateName?: string | null, cityName?: string | null): Coordinates | null => {
  if (!stateName) return null
  const state = NG_STATES.find(item => item.name.toLowerCase() === stateName.trim().toLowerCase())
  return state ? cityCentroid(state.isoCode, cityName) : null
}
