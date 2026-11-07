import type { ReactNode } from 'react'
import type { ShipbubbleState } from '@/api/shipping-settings'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Icon, type IconName } from '@/components/ui/Icon'
import { Modal, ModalTitle } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { formatAccuracy, GOOD_ACCURACY_M, useShipbubbleSettingsForm, type ShipbubbleSettingsForm } from '../../hooks/useShipbubbleSettingsForm'
import { OptionSelect } from '../OptionSelect'
import { AddressAutocomplete } from './AddressAutocomplete'

// ─── Layout helpers (sink-inventory's SettingsTile / Field / PinMethodButton / LockedValue) ───

function SettingsTile({ step, icon, title, description, children }: { step: number; icon: IconName; title: string; description: string; children: ReactNode }) {
  return <div className="rounded-2xl border border-[#E2E9E5] bg-white p-4 sm:p-5">
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl border border-[#E2E9E5] bg-[#F7FAF7] text-[#4D6A5A]">
        <span className="text-[7px] font-extrabold uppercase tracking-[.08em] opacity-80">Step</span>
        <span className="text-[11px] font-black leading-none">{String(step).padStart(2, '0')}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2"><span className="mt-0.5 text-[#438352]"><Icon name={icon} size={16}/></span><div><div className="text-sm font-extrabold text-[#17382C]">{title}</div><div className="mt-0.5 text-[11px] leading-5 text-[#7E8E86]">{description}</div></div></div>
        {children}
      </div>
    </div>
  </div>
}

function Label({ children }: { children: ReactNode }) {
  return <span className="mb-2 block text-[12px] font-extrabold text-[#34483F]">{children}</span>
}

function PinMethodButton({ active, onClick, icon, title, hint }: { active: boolean; onClick: () => void; icon: IconName; title: string; hint: string }) {
  return <button type="button" onClick={onClick} aria-pressed={active} className={cn('rounded-lg px-2.5 py-2 text-left transition-colors', active ? 'bg-white text-[#286B43] shadow-sm ring-1 ring-[#CFE4CD]' : 'text-[#60736A] hover:bg-white/60')}>
    <span className="flex items-center gap-1.5 text-xs font-extrabold"><Icon name={icon} size={14}/>{title}</span>
    <span className="mt-0.5 block text-[10px] text-[#87968F]">{hint}</span>
  </button>
}

/** A state/city value the pin supplied. "Change" lets the merchant edit it (and re-pins). */
function LockedValue({ value, onChange }: { value: string; onChange: () => void }) {
  return <div>
    <div className="flex h-12 items-center justify-between gap-2 rounded-xl border border-[#DCE7E0] bg-[#F7FAF7] px-3.5">
      <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-[#09261C]"><span className="text-[#9AA8A1]"><Icon name="shield" size={14}/></span><span className="truncate">{value}</span></span>
      <button type="button" onClick={onChange} className="shrink-0 text-xs font-extrabold text-[#438352] hover:text-[#2F6A3C]">Change</button>
    </div>
    <p className="mt-1.5 text-[11px] text-[#7C8D85]">Set from your pinned location. If you change it, we&apos;ll re-pin from the new address.</p>
  </div>
}

const Spinner = () => <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true"/>

// ─── Step 1: pickup address ───────────────────────────────────────────────

function PinnedCard({ form }: { form: ShipbubbleSettingsForm }) {
  const { gps, pinSource } = form
  return <div className="rounded-xl border border-[#CFE4CD] bg-[#F1F8EF] p-3">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-2">
        <span className="mt-0.5 shrink-0 text-[#438352]"><Icon name="check" size={16} stroke={2.4}/></span>
        <div className="min-w-0">
          <p className="text-xs font-extrabold text-[#214A31]">Pickup point pinned</p>
          {form.resolvingAddress
            ? <p className="mt-1 flex items-center gap-1.5 text-xs text-[#4D7656]"><Spinner/>Looking up the address…</p>
            : form.resolvedAddress
              ? <p className="mt-1 text-[13px] font-bold leading-snug text-[#214A31]">{form.resolvedAddress}</p>
              : <p className="mt-1 break-all font-mono text-[11px] text-[#2F5A3C]">{form.settings.latitude}, {form.settings.longitude}</p>}
          <p className="mt-1 text-[11px] text-[#4D7656]">
            {pinSource === 'gps'
              ? gps.accuracy != null ? `From your device's location, accurate to about ${formatAccuracy(gps.accuracy)}` : "From your device's location"
              : pinSource === 'search' ? 'From the address you picked' : pinSource === 'typed' ? 'Found from the address you entered' : 'Saved from a previous setup'}
          </p>
        </div>
      </div>
      {form.pinMethod === 'gps' && <Button variant="outline" onClick={gps.capture} disabled={gps.status === 'loading'} className="shrink-0 border-[#9CC9A3] px-3 py-2 text-xs text-[#286B43]">
        {gps.status === 'loading' ? <><Spinner/>{gps.liveAccuracy != null ? `±${formatAccuracy(gps.liveAccuracy)}` : 'Updating'}</> : <><Icon name="location" size={14}/>{pinSource === 'gps' ? 'Recapture' : 'Use my location'}</>}
      </Button>}
    </div>
    {pinSource === 'gps' && gps.accuracy != null && gps.accuracy > GOOD_ACCURACY_M && <p className="mt-2 text-[11px] font-semibold text-[#A16A15]">This pin is approximate. Step outside and recapture for a tighter fix, or search your address instead.</p>}
  </div>
}

function PickupStep({ form }: { form: ShipbubbleSettingsForm }) {
  const { settings, gps } = form
  return <SettingsTile step={1} icon="location" title="Pickup Address" description="Where Shipbubble riders should collect every shipment.">
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label>Pin your pickup point</Label>
        <div className="grid grid-cols-2 gap-1 rounded-xl border border-[#E2E9E5] bg-[#F3F7F4] p-1">
          <PinMethodButton active={form.pinMethod === 'search'} onClick={() => form.switchPinMethod('search')} icon="search" title="Search address" hint="Works on any device"/>
          <PinMethodButton active={form.pinMethod === 'gps'} onClick={() => form.switchPinMethod('gps')} icon="location" title="Current location" hint="Best on a phone, at the shop"/>
        </div>

        <div className="mt-3 space-y-3">
          {form.pinMethod === 'search'
            ? <div>
              <AddressAutocomplete
                value={settings.street}
                onChange={form.handleStreetTyped}
                onSelect={form.handleAddressPicked}
                placeholder="Search your pickup address, e.g. 14 Allen Avenue, Ikeja"
                hasCoordinates={form.hasCoordinates && form.pinSource === 'search'}
                renderNoResults={() => <p className="mt-1.5 text-[11px] text-[#7C8D85]">No match for that address. <button type="button" onClick={() => form.switchPinMethod('gps')} className="font-extrabold text-[#438352]">Use your current location instead</button></p>}
              />
              {form.searchPinFailed
                ? <p className="mt-1.5 text-[11px] font-semibold text-[#A16A15]">We found this address but couldn&apos;t pin its exact location. Pick another suggestion, or <button type="button" onClick={() => form.switchPinMethod('gps')} className="font-extrabold underline underline-offset-2">use your current location</button>.</p>
                : !form.hasCoordinates && <p className="mt-1.5 text-[11px] text-[#7C8D85]">{form.lookupEnabled ? 'Pick a suggestion from the list so riders get the exact point.' : 'Type your street, then pick the state and city below — we’ll pin your city’s location.'}</p>}
            </div>
            : !form.hasCoordinates && <div className="rounded-xl border border-dashed border-[#C9D8CF] bg-[#FAFCFA] p-4 text-center">
              <span className="mx-auto flex justify-center text-[#9AA8A1]"><Icon name="location" size={20}/></span>
              <p className="mt-2 text-xs leading-5 text-[#7C8D85]">Stand at your pickup location and capture its coordinates. Riders are routed to this exact point.</p>
              <Button onClick={gps.capture} disabled={gps.status === 'loading'} className="mt-3 px-3 py-2 text-xs">
                {gps.status === 'loading' ? <><Spinner/>{gps.liveAccuracy != null ? `Improving fix… ±${formatAccuracy(gps.liveAccuracy)}` : 'Getting location…'}</> : <><Icon name="location" size={14}/>Use my current location</>}
              </Button>
            </div>}

          {form.hasCoordinates && <PinnedCard form={form}/>}

          {form.pinMethod === 'gps' && gps.status === 'error' && gps.error && <div className="rounded-xl border border-[#F3C9C3] bg-[#FFF3F1] p-3">
            <p className="text-xs font-semibold text-[#B23D33]">{gps.error}</p>
            <Button variant="outline" icon="search" onClick={() => form.switchPinMethod('search')} className="mt-2 bg-white px-3 py-2 text-xs">Search your address instead</Button>
          </div>}
        </div>
      </div>

      {/* In search mode the autocomplete above is the street field. */}
      {form.pinMethod === 'gps' && <div className="sm:col-span-2">
        <Field label="Street" value={settings.street} onValueChange={form.handleStreetTyped} placeholder="e.g. 14 Allen Avenue, Ikeja" hint="Written for the rider to read. The pinned point above is what they navigate to."/>
      </div>}

      {form.cityLocked
        ? <div className="sm:col-span-2"><Label>City & State</Label><LockedValue value={`${settings.city}, ${settings.state}`} onChange={form.unlockRegion}/></div>
        : <>
          <div>
            {form.stateLocked
              ? <><Label>State</Label><LockedValue value={settings.state} onChange={form.unlockRegion}/></>
              : <OptionSelect label="State" placeholder="Pick a state" options={form.states} value={form.selectedStateIso} onChange={event => form.handleStateChange(event.target.value)}/>}
          </div>
          <div>
            {form.useCustomCityInput
              ? <div className="space-y-1.5">
                {/* Longer pause than the dropdown: this fires on every keystroke. */}
                <Field label="City" value={settings.city} onValueChange={value => form.handleCityChange(value, 900)} placeholder={form.selectedStateIso ? 'Enter your city' : 'Pick a state first'} disabled={!form.selectedStateIso}/>
                {form.hasCityList && <button type="button" onClick={form.backToCityList} className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#438352]"><Icon name="arrow" size={12}/>Back to city list</button>}
              </div>
              : <OptionSelect label="City" placeholder={form.selectedStateIso ? 'Pick a city' : 'Pick a state first'} disabled={!form.selectedStateIso} options={[...form.cityOptions, { value: '__other__', label: 'Other (type your own)' }]} value={settings.city} onChange={event => form.handleCitySelect(event.target.value)}/>}
          </div>
        </>}

      {form.geocodeStatus !== 'idle' && <div className="-mt-1 sm:col-span-2">
        {form.geocodeStatus === 'loading'
          ? <p className="flex items-center gap-1.5 text-[11px] text-[#7C8D85]"><Spinner/>Finding this address on the map…</p>
          : <p className="text-[11px] font-semibold text-[#A16A15]">We couldn&apos;t find this address on the map, so it isn&apos;t pinned. You can still save, and riders will use the written address. For an exact pin, <button type="button" onClick={() => form.switchPinMethod(form.pinMethod === 'gps' ? 'search' : 'gps')} className="font-extrabold underline underline-offset-2">{form.pinMethod === 'gps' ? 'search for it' : 'use your current location'}</button>.</p>}
      </div>}

      <div className="sm:col-span-2"><Field label="Phone" type="tel" inputMode="tel" autoComplete="tel" value={settings.phone} onValueChange={value => form.update('phone', value)} placeholder="Phone number, e.g. 0803 000 0000"/></div>
      <div className="sm:col-span-2"><Field label="Landmark" value={settings.landmark} onValueChange={value => form.update('landmark', value)} placeholder="e.g. Behind Shoprite"/></div>
    </div>
  </SettingsTile>
}

// ─── Step 2: category ─────────────────────────────────────────────────────

function CategoryStep({ form }: { form: ShipbubbleSettingsForm }) {
  return <SettingsTile step={2} icon="box" title="Shipping Category" description="Helps Shipbubble pick carriers and rate cards that match your products.">
    <div className="mt-4">
      {form.categoriesLoading
        ? <Skeleton className="h-12 rounded-xl"/>
        : <OptionSelect label="Category" placeholder="Pick a category" options={form.categories} value={form.settings.category ? String(form.settings.category.id) : ''} onChange={event => form.selectCategory(event.target.value)}/>}
    </div>
  </SettingsTile>
}

// ─── Step 3: default package size (sink: BoxSizePickerModal) ─────────────

function BoxPreview({ imageUrl, name, size = 'h-12 w-12' }: { imageUrl: string; name: string; size?: string }) {
  return imageUrl
    ? <img src={imageUrl} alt={name} className={cn('shrink-0 rounded-xl border border-[#E4EBE7] bg-white object-contain p-1', size)}/>
    : <span className={cn('flex shrink-0 items-center justify-center rounded-xl bg-[#EAF5E9] text-[#438352]', size)}><Icon name="box" size={20}/></span>
}

function PackageSizeStep({ form }: { form: ShipbubbleSettingsForm }) {
  const box = form.settings.packageSize
  return <SettingsTile step={3} icon="box" title="Default Package Size" description="The box and maximum weight Shipbubble quotes with when a shipment has no size of its own.">
    <button type="button" onClick={form.openBoxPicker} className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-[#DCE7E0] bg-white p-3.5 text-left transition hover:border-[#529661]">
      <BoxPreview imageUrl={box?.imageUrl ?? ''} name={box?.name ?? 'Package'}/>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-extrabold text-[#17382C]">{box?.name || 'Pick a box size'}</span>
        {box
          ? <span className="mt-0.5 block text-[11px] text-[#7D8D85]">Max weight: {box.maxWeight} kg · H:{box.height}cm · L:{box.length}cm · W:{box.width}cm</span>
          : <span className="mt-0.5 block text-[11px] text-[#7D8D85]">Choose the size most of your orders ship in</span>}
      </span>
      <span className="shrink-0 text-xs font-extrabold text-[#438352]">{box ? 'Change' : 'Choose'}</span>
    </button>
  </SettingsTile>
}

function BoxSizePicker({ form }: { form: ShipbubbleSettingsForm }) {
  const current = form.settings.packageSize?.name
  return <Modal open={form.boxPickerOpen} onClose={form.closeBoxPicker} title="Choose a default package size" panelClassName="max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-[0_25px_80px_rgba(9,38,28,.2)]">
    <div className="flex items-start justify-between gap-3">
      <div><div className="text-lg font-black text-[#17382C]">Default package size</div><div className="mt-1 text-xs text-[#819088]">Pick the box that fits most of what you sell.</div></div>
      <button type="button" aria-label="Close" onClick={form.closeBoxPicker} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#E0E8E3]"><Icon name="close" size={17}/></button>
    </div>
    {form.boxSizesLoading
      ? <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-40 rounded-2xl"/>)}</div>
      : form.boxSizes.length === 0
        ? <p className="mt-6 rounded-2xl bg-[#F4F8F5] p-5 text-center text-xs text-[#7D8D85]">No box sizes are available right now. Try again shortly.</p>
        : <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">{form.boxSizes.map(box => {
          const selected = current === box.name
          return <button key={box.name} type="button" onClick={() => form.pickBoxSize(box)} aria-pressed={selected} className={cn('relative flex flex-col items-center rounded-2xl border-2 p-4 text-center transition', selected ? 'border-[#529661] bg-[#F5FAF4]' : 'border-[#E4EBE7] hover:border-[#BFD9C3]')}>
            {selected && <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#529661] text-white"><Icon name="check" size={11} stroke={3}/></span>}
            <BoxPreview imageUrl={box.imageUrl} name={box.name} size="h-16 w-16"/>
            <span className="mt-3 text-xs font-extrabold text-[#17382C]">{box.name}</span>
            <span className="mt-1 text-[10px] font-bold text-[#438352]">Max weight: {box.maxWeight} kg</span>
            <span className="mt-0.5 text-[10px] text-[#87968F]">H:{box.height}cm · L:{box.length}cm · W:{box.width}cm</span>
          </button>
        })}</div>}
  </Modal>
}

// ─── Modal ────────────────────────────────────────────────────────────────

function SettingsBody({ saved, onClose }: { saved: ShipbubbleState | undefined; onClose: () => void }) {
  const form = useShipbubbleSettingsForm({ saved, onClose })
  return <>
    <div className="flex items-start justify-between gap-3 border-b border-[#EDF1EF] px-5 py-4 sm:px-7 sm:py-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#286B43] text-white"><Icon name="settings" size={18}/></span>
        <div><ModalTitle className="text-lg font-black text-[#17382C]">Shipbubble Settings</ModalTitle><div className="mt-1 text-xs leading-5 text-[#819088]">Tell Shipbubble where to collect parcels and what you ship.</div></div>
      </div>
      <button type="button" aria-label="Close" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#E0E8E3]"><Icon name="close" size={17}/></button>
    </div>
    <div className="flex-1 space-y-4 overflow-y-auto bg-[#F7F9F7] px-4 py-5 sm:px-7">
      <PickupStep form={form}/>
      <CategoryStep form={form}/>
      <PackageSizeStep form={form}/>
    </div>
    <BoxSizePicker form={form}/>
    <div className="flex flex-col-reverse gap-3 border-t border-[#EDF1EF] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
      <p className="text-center text-[11px] text-[#87968F] sm:text-left">Changes apply to new shipments only.</p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onClose} disabled={form.saving} className="flex-1 sm:flex-none">Cancel</Button>
        <Button icon="check" onClick={form.handleSave} loading={form.saving} className="flex-1 sm:flex-none">{form.saving ? 'Saving...' : 'Save Changes'}</Button>
      </div>
    </div>
  </>
}

/** Shipbubble Configure modal: pickup address + shipping category. Re-hydrates from the business on every open. */
export function ShipbubbleSettingsModal({ open, onClose, saved }: { open: boolean; onClose: () => void; saved: ShipbubbleState | undefined }) {
  return <Modal open={open} onClose={onClose} overlayClassName="bg-[#09261C]/40 p-0 backdrop-blur-[2px] sm:p-4" panelClassName="flex h-full w-full flex-col overflow-hidden bg-white sm:h-auto sm:max-h-[calc(100vh-2rem)] sm:max-w-2xl sm:rounded-3xl sm:shadow-[0_25px_80px_rgba(9,38,28,.2)]">
    <SettingsBody saved={saved} onClose={onClose}/>
  </Modal>
}
