import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { EMPTY_SHIPBUBBLE, useSaveShipbubble, useShipbubbleCategories, type ShipbubbleState, type ShippingCompany } from '@/api/shipping-settings'
import { citiesOfState, fetchAddressFromCoordinates, geocodeAddress, isAddressLookupEnabled, NG_STATES, stateIsoFor, type AddressSuggestion } from '@/lib/address'
import { shipbubbleSetupSchema } from '../shippingSchemas'

/**
 * Shipbubble Configure modal — a port of sink-inventory's ShipbubbleSettingsModal +
 * useShipbubbleHook (minus the default package size step).
 *
 * The hook is mounted only while the modal is open, so every open starts from the saved
 * business values (sink's "re-hydrate on every open").
 *
 * The pickup point can be pinned two ways, each the fallback for the other:
 *  - "search": geocode the address picked from the autocomplete (any device);
 *  - "gps": the device's own fix (best on a phone at the shop).
 * Behind both, a hand-typed street/city/state is geocoded quietly so the save still
 * carries coordinates that match the text.
 */

// A real satellite fix is under ~50m; wifi/cell is hundreds; IP geolocation can be
// hundreds of kilometres out. Anything past this radius is rejected, not warned about.
const MAX_USABLE_ACCURACY_M = 1_000
/** Above this we accept the fix but say it's approximate; also the early-exit bar. */
export const GOOD_ACCURACY_M = 100
/** How long to keep listening for a better fix before taking the best so far. */
const GPS_WATCH_WINDOW_MS = 8_000

/** "12m" / "1.4km" / "604km". */
export const formatAccuracy = (metres: number) =>
  metres < 1_000 ? `${Math.round(metres)}m` : `${(metres / 1_000).toFixed(metres < 10_000 ? 1 : 0)}km`

type PinMethod = 'search' | 'gps'
type PinSource = 'search' | 'gps' | 'typed' | null

export const useShipbubbleSettingsForm = ({ saved, onClose }: { saved: ShipbubbleState | undefined; onClose: () => void }) => {
  const save = useSaveShipbubble()
  const { categories, isLoading: categoriesLoading } = useShipbubbleCategories()

  const initial = saved?.settings ?? EMPTY_SHIPBUBBLE
  const [settings, setSettings] = useState(initial)
  const companies: ShippingCompany[] = saved?.companies ?? []

  const hasCoordinates = Boolean(settings.latitude.trim() && settings.longitude.trim())
  const selectedStateIso = stateIsoFor(settings.state)

  const [pinMethod, setPinMethod] = useState<PinMethod>('search')
  const [pinSource, setPinSource] = useState<PinSource>(null)
  /** "Change" pressed on a locked state/city: the pin stays until something is actually edited. */
  const [regionUnlocked, setRegionUnlocked] = useState(false)
  const [geocodeStatus, setGeocodeStatus] = useState<'idle' | 'loading' | 'failed'>('idle')
  const [searchPinFailed, setSearchPinFailed] = useState(false)
  /** Which of state/city the pin itself supplied — locked while the pin stands. Snapshotted from saved coordinates. */
  const [pinLock, setPinLock] = useState(() => {
    const pinned = Boolean(initial.latitude.trim() && initial.longitude.trim()) && Boolean(stateIsoFor(initial.state))
    return { state: pinned, city: pinned && Boolean(initial.city.trim()) }
  })
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null)
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null)
  const [resolvingAddress, setResolvingAddress] = useState(false)
  const [liveAccuracy, setLiveAccuracy] = useState<number | null>(null)
  const [customCityMode, setCustomCityMode] = useState(false)

  const geocodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  /** Bumped by every lookup and every pin from elsewhere, so a slow answer never overwrites a newer action. */
  const geocodeRequestRef = useRef(0)
  const watchIdRef = useRef<number | null>(null)
  const watchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const bestFixRef = useRef<GeolocationCoordinates | null>(null)

  // ─── Setters (useShipbubbleHook) ─────────────────────────────────────────
  const update = <K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) => setSettings(prev => ({ ...prev, [key]: value }))
  const setCoordinates = (latitude: number, longitude: number) => setSettings(prev => ({ ...prev, latitude: latitude.toFixed(6), longitude: longitude.toFixed(6) }))
  const clearCoordinates = () => setSettings(prev => ({ ...prev, latitude: '', longitude: '' }))
  /** One atomic update, so a re-render never pairs the new street with old coordinates. */
  const applyAddressSuggestion = (suggestion: AddressSuggestion) => setSettings(prev => ({
    ...prev,
    street: suggestion.address || suggestion.label || prev.street,
    city: suggestion.city || prev.city,
    state: suggestion.state || prev.state,
    latitude: suggestion.latitude,
    longitude: suggestion.longitude,
  }))

  // ─── Geocoding of typed addresses ────────────────────────────────────────
  const cancelGeocode = () => {
    if (geocodeTimerRef.current) { clearTimeout(geocodeTimerRef.current); geocodeTimerRef.current = null }
    geocodeRequestRef.current += 1
    setGeocodeStatus('idle')
  }

  const scheduleGeocode = (street: string, city: string, state: string, delayMs: number) => {
    cancelGeocode()
    const stateIso = stateIsoFor(state)
    if (!isAddressLookupEnabled() || !stateIso || !city.trim() || street.trim().length < 3) return
    const request = geocodeRequestRef.current
    geocodeTimerRef.current = setTimeout(async () => {
      geocodeTimerRef.current = null
      setGeocodeStatus('loading')
      const match = await geocodeAddress(street, city, state, stateIso)
      if (request !== geocodeRequestRef.current) return
      if (!match) { setGeocodeStatus('failed'); return }
      // Coordinates only: the merchant's own city/state wording stands.
      setCoordinates(Number(match.latitude), Number(match.longitude))
      setPinSource('typed')
      setRegionUnlocked(false)
      setResolvedAddress(match.label || match.address || null)
      setGeocodeStatus('idle')
    }, delayMs)
  }

  // ─── GPS ────────────────────────────────────────────────────────────────
  const stopWatching = () => {
    if (watchIdRef.current !== null) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null }
    if (watchTimerRef.current) { clearTimeout(watchTimerRef.current); watchTimerRef.current = null }
  }

  /** A provider state only counts if the dropdown knows it ("Lagos State", typos stay editable). */
  const regionLockFor = (suggestion: AddressSuggestion) => {
    const state = NG_STATES.some(item => item.name === suggestion.state)
    return { state, city: state && Boolean(suggestion.city?.trim()) }
  }

  /** Keeps the tightest reading of the watch window, then pins it. */
  const applyBestFix = () => {
    stopWatching()
    const coords = bestFixRef.current
    if (!coords) { setGpsStatus('error'); setGpsError('Couldn\'t get your location. Please try again.'); return }
    const { latitude, longitude, accuracy } = coords

    // Reject an unusable fix outright — its reverse-geocoded address would look plausible and mislead.
    if (Number.isFinite(accuracy) && accuracy > MAX_USABLE_ACCURACY_M) {
      setGpsStatus('error')
      setGpsAccuracy(null)
      setResolvedAddress(null)
      setGpsError(`Your browser could only place you within ${formatAccuracy(accuracy)}, so this location was not saved. That usually means no GPS is available — common on desktop, where the position is guessed from your internet connection. Open this page on a phone at your pickup point, or fill in the address below by hand.`)
      return
    }

    // Commit the pin before the lookup — a slow or failed reverse geocode must never cost the fix.
    cancelGeocode()
    setRegionUnlocked(false)
    setCoordinates(latitude, longitude)
    setPinSource('gps')
    setSearchPinFailed(false)
    setPinLock({ state: false, city: false })
    setGpsAccuracy(Number.isFinite(accuracy) ? Math.round(accuracy) : null)
    setGpsStatus('success')

    // Fill the address in behind it, purely as confirmation. Failure is silent by design.
    setResolvingAddress(true)
    fetchAddressFromCoordinates(latitude, longitude)
      .then(suggestion => {
        if (!suggestion) return
        setResolvedAddress(suggestion.label || suggestion.address || null)
        applyAddressSuggestion({ ...suggestion, latitude: latitude.toFixed(6), longitude: longitude.toFixed(6) })
        setPinLock(regionLockFor(suggestion))
        if (suggestion.city) setCustomCityMode(true)
      })
      .finally(() => setResolvingAddress(false))
  }

  const captureGps = () => {
    if (!navigator.geolocation) { setGpsStatus('error'); setGpsError('This browser doesn\'t support location access.'); return }
    stopWatching()
    bestFixRef.current = null
    setLiveAccuracy(null)
    setGpsStatus('loading')
    setGpsError(null)
    setResolvedAddress(null)

    watchIdRef.current = navigator.geolocation.watchPosition(
      position => {
        const best = bestFixRef.current
        if (!best || position.coords.accuracy < best.accuracy) {
          bestFixRef.current = position.coords
          setLiveAccuracy(Math.round(position.coords.accuracy))
        }
        if (position.coords.accuracy <= GOOD_ACCURACY_M) applyBestFix()
      },
      error => {
        stopWatching()
        setGpsStatus('error')
        setGpsAccuracy(null)
        setLiveAccuracy(null)
        setGpsError(error.code === error.PERMISSION_DENIED
          ? 'Location access was denied. Allow it in your browser settings, then try again.'
          : error.code === error.TIMEOUT
            ? 'Timed out finding your location. Move somewhere with a clearer view of the sky and try again.'
            : 'Couldn\'t get your location. Please try again.')
      },
      { enableHighAccuracy: true, timeout: GPS_WATCH_WINDOW_MS, maximumAge: 0 },
    )
    // Hard stop: take the best reading by the end of the window.
    watchTimerRef.current = setTimeout(applyBestFix, GPS_WATCH_WINDOW_MS)
  }

  // Never leave a watch running after the modal closes — it drains a phone battery.
  useEffect(() => () => {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
    if (watchTimerRef.current) clearTimeout(watchTimerRef.current)
    if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current)
  }, [])

  // ─── Field handlers ──────────────────────────────────────────────────────
  const switchPinMethod = (method: PinMethod) => {
    if (method === 'search') {
      stopWatching()
      if (gpsStatus === 'loading' || gpsStatus === 'error') setGpsStatus('idle')
      setGpsError(null)
    }
    setPinMethod(method)
  }

  const unlockRegion = () => { setPinLock({ state: false, city: false }); setRegionUnlocked(true) }

  /** State/city edited: coordinates that no longer describe the address are dropped and looked up again. */
  const handleRegionEdited = (state: string, city: string, delayMs = 300) => {
    const replacesPin = !hasCoordinates || pinSource === 'typed' || regionUnlocked
    if (!replacesPin) return
    if (hasCoordinates) { clearCoordinates(); setPinSource(null); setResolvedAddress(null); setGpsAccuracy(null) }
    scheduleGeocode(settings.street, city, state, delayMs)
  }

  const handleAddressPicked = (suggestion: AddressSuggestion) => {
    cancelGeocode()
    setRegionUnlocked(false)
    applyAddressSuggestion(suggestion)
    const pinned = Boolean(suggestion.latitude && suggestion.longitude)
    setPinLock(pinned ? regionLockFor(suggestion) : { state: false, city: false })
    setPinSource(pinned ? 'search' : null)
    setSearchPinFailed(!pinned)
    setResolvedAddress(pinned ? suggestion.address || suggestion.label : null)
    setGpsStatus('idle')
    setGpsAccuracy(null)
    setGpsError(null)
  }

  const handleStreetTyped = (value: string) => {
    update('street', value)
    setSearchPinFailed(false)
    // Text-derived coordinates stop matching once edited. A GPS pin stays (the street is a note for the rider).
    const derivedFromText = pinSource === 'search' || pinSource === 'typed'
    if (derivedFromText) { clearCoordinates(); setPinSource(null); setResolvedAddress(null) }
    // Search mode's dropdown is already looking it up; the plain GPS-mode street field geocodes on a pause.
    if (pinMethod === 'gps' && (derivedFromText || !hasCoordinates)) scheduleGeocode(value, settings.city, settings.state, 900)
    else cancelGeocode()
  }

  const cityOptions = useMemo(() => citiesOfState(selectedStateIso), [selectedStateIso])
  /** Saved city not in the list → free-text mode, so it can be seen and edited. */
  const cityIsCustom = settings.city.length > 0 && cityOptions.length > 0 && !cityOptions.some(city => city.name === settings.city)
  const useCustomCityInput = customCityMode || cityIsCustom || (Boolean(selectedStateIso) && cityOptions.length === 0)

  const handleStateChange = (iso: string) => {
    const name = NG_STATES.find(state => state.isoCode === iso)?.name ?? ''
    setSettings(prev => ({ ...prev, state: name, city: '' }))
    setCustomCityMode(false)
    handleRegionEdited(name, '')
  }

  const handleCityChange = (city: string, delayMs?: number) => {
    update('city', city)
    handleRegionEdited(settings.state, city, delayMs)
  }

  const handleCitySelect = (value: string) => {
    if (value === '__other__') { setCustomCityMode(true); handleCityChange('') }
    else handleCityChange(value)
  }

  const backToCityList = () => { setCustomCityMode(false); handleCityChange('') }

  const stateLocked = hasCoordinates && pinLock.state && Boolean(selectedStateIso)
  const cityLocked = stateLocked && pinLock.city && Boolean(settings.city.trim())

  // ─── Save ────────────────────────────────────────────────────────────────
  /** Saving the Configure form is by definition enabling and activating Shipbubble. */
  const handleSave = () => {
    const result = shipbubbleSetupSchema.safeParse(settings)
    if (!result.success) { toast.error(result.error.issues[0]?.message ?? 'Check the pickup details.'); return }
    const nextCompanies = Array.from(new Set<ShippingCompany>([...companies, 'SHIPBUBBLE']))
    save.mutate({ settings: { ...settings, isActive: true }, companies: nextCompanies }, { onSuccess: onClose })
  }

  return {
    settings,
    update,
    saving: save.isPending,
    handleSave,
    lookupEnabled: isAddressLookupEnabled(),
    // pin
    pinMethod, switchPinMethod, pinSource, hasCoordinates, searchPinFailed, resolvedAddress, resolvingAddress,
    gps: { status: gpsStatus, error: gpsError, accuracy: gpsAccuracy, liveAccuracy, capture: captureGps },
    geocodeStatus,
    handleAddressPicked, handleStreetTyped,
    // region
    states: NG_STATES.map(state => ({ value: state.isoCode, label: state.name })),
    selectedStateIso, handleStateChange,
    cityOptions: cityOptions.map(city => ({ value: city.name, label: city.name })),
    useCustomCityInput, hasCityList: cityOptions.length > 0, handleCityChange, handleCitySelect, backToCityList,
    stateLocked, cityLocked, unlockRegion,
    // category
    categories: categories.map(category => ({ value: String(category.id), label: category.name })),
    categoriesLoading,
    selectCategory: (id: string) => {
      const picked = categories.find(category => String(category.id) === id)
      if (picked) update('category', picked)
    },
  }
}

export type ShipbubbleSettingsForm = ReturnType<typeof useShipbubbleSettingsForm>
