import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { EMPTY_SHIPBUBBLE, NIGERIAN_STATES, useSaveShipbubble, useSetShipbubbleActive, useShipbubbleOptions, useShipbubbleSettings, type ShipbubbleSetup, type ShippingCompany } from '@/api/shipping-settings'
import { useDisclosure } from '@/hooks/useDisclosure'
import { pickupSchema, type PickupValues } from '../schemas'

const toFormValues = (settings: ShipbubbleSetup): PickupValues => ({
  street: settings.street,
  city: settings.city,
  state: NIGERIAN_STATES.find(state => state.toLowerCase() === settings.state.toLowerCase()) ?? '',
  phone: settings.phone,
  landmark: settings.landmark,
  categoryId: settings.category ? String(settings.category.id) : '',
  packageSize: settings.packageSize?.name ?? '',
})

/**
 * Shipping setup tab, ported from sink-inventory's ShippingTab /
 * AutomatedShipping / ShipbubbleSettingsModal:
 *  - the header toggle connects or disconnects Shipbubble (first connect shows the terms);
 *  - the pickup form saves address, item category and default box size;
 *  - Chowdeck is listed as coming soon, as in sink-inventory.
 */
export const useShippingSection = () => {
  const settingsQuery = useShipbubbleSettings()
  const options = useShipbubbleOptions()
  const save = useSaveShipbubble()
  const setActive = useSetShipbubbleActive()
  const agreement = useDisclosure()
  const deactivate = useDisclosure()
  const [connecting, setConnecting] = useState(false)

  const saved = settingsQuery.data
  const serverValues = useMemo(() => toFormValues(saved?.settings ?? EMPTY_SHIPBUBBLE), [saved])
  const form = useForm<PickupValues>({ resolver: zodResolver(pickupSchema), values: serverValues, resetOptions: { keepDirtyValues: true } })
  const selectedSize = useWatch({ control: form.control, name: 'packageSize' })

  const active = Boolean(saved?.settings.isActive)
  const isConfigured = Boolean(saved?.isConfigured)

  /** Builds the full settings object from the form and pushes it with the given active flag. */
  const persist = (values: PickupValues, isActive: boolean, successMessage: string) => {
    const category = options.categories.find(item => String(item.id) === values.categoryId) ?? null
    const packageSize = options.boxSizes.find(item => item.name === values.packageSize) ?? saved?.settings.packageSize ?? null
    const base = saved?.settings ?? EMPTY_SHIPBUBBLE
    const settings: ShipbubbleSetup = { ...base, ...values, category, packageSize, isActive }
    const companies: ShippingCompany[] = isActive ? ['SHIPBUBBLE'] : (saved?.companies ?? []).filter(company => company !== 'SHIPBUBBLE')
    save.mutate({ settings, companies }, {
      onSuccess: () => { toast.success(successMessage); form.reset(values) },
      onError: error => toast.error(errorMessage(error)),
    })
  }

  const saveSetup = form.handleSubmit(values => persist(values, active, 'Shipping setup saved'), () => toast.error('Complete the highlighted pickup details'))

  /** Header toggle. Turning on the first time shows the Shipbubble terms. */
  const toggleActive = (next: boolean) => {
    if (!next) return deactivate.open()
    if (!isConfigured) return agreement.open()
    setActive.mutate(true, { onSuccess: () => toast.success('Shipbubble connected'), onError: error => toast.error(errorMessage(error)) })
  }

  /** "I agree & connect": saves the pickup form as active, or points to what's missing. */
  const acceptAgreement = () => {
    setConnecting(true)
    form.handleSubmit(
      values => { agreement.close(); persist(values, true, 'Shipbubble connected — live rates are on'); setConnecting(false) },
      () => { agreement.close(); setConnecting(false); toast.info('Add your pickup details below, then save to finish connecting') },
    )()
  }

  const confirmDeactivate = () =>
    setActive.mutate(false, {
      onSuccess: () => { deactivate.close(); toast.success('Shipbubble turned off') },
      onError: error => toast.error(errorMessage(error)),
    })

  return {
    isLoading: settingsQuery.isLoading,
    optionsLoading: options.isLoading,
    active,
    isConfigured,
    form,
    states: NIGERIAN_STATES,
    categoryOptions: options.categories.map(category => ({ value: String(category.id), label: category.name })),
    boxSizes: options.boxSizes,
    selectedSize,
    selectSize: (name: string) => form.setValue('packageSize', name, { shouldDirty: true, shouldValidate: true }),
    saveSetup,
    saving: save.isPending,
    toggleActive,
    toggling: setActive.isPending,
    agreement: { isOpen: agreement.isOpen, close: agreement.close, accept: acceptAgreement, accepting: connecting || save.isPending },
    deactivate: { isOpen: deactivate.isOpen, close: deactivate.close, confirm: confirmDeactivate, pending: setActive.isPending },
  }
}
