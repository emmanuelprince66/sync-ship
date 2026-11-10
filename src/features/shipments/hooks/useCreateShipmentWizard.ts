import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useSettlementAccounts } from '@/api/banks'
import { isLive } from '@/api/http'
import { useAddItem, useItems } from '@/api/items'
import { useBusinessSettings } from '@/api/settings'
import { useShipbubbleSettings, useShippingMethods } from '@/api/shipping-settings'
import { packageTotal, useCreateShipment, useDeliveryPartners, useShipmentRates } from '@/api/shipments'
import type { CatalogItem, CheckoutMethod, CreateShipmentResult, DeliveryPartner, PackageItem } from '@/api/types'
import type { IconName } from '@/components/ui/Icon'
import { useClipboard } from '@/hooks/useClipboard'
import { paths, settingsPath } from '@/routes/paths'
import { NIGERIAN_STATES } from '../constants'
import { emptyPackageItem, shipmentFormDefaults, shipmentFormSchema, type PackageItemValues, type PaymentMethodValue, type PaymentStatusValue, type ShipmentFormValues } from '../schemas'
import { shortAddress } from '../utils'
import { checkoutMessage, useCheckoutLink } from './useCheckoutLink'

export const WIZARD_STEPS = ['Package details', 'Checkout method', 'Delivery rate', 'Review'] as const
/** 1–4 are the wizard steps, 5 is the success screen. */
export type WizardStep = 1 | 2 | 3 | 4 | 5

/** How the order is delivered: Shipbubble quotes, the business's own rates (in-house), or sample data. */
export type DeliveryMode = 'shipbubble' | 'inhouse' | 'mock'

const toPackageItems = (products: PackageItemValues[]): PackageItem[] => products.map((product, index) => ({ id: index + 1, ...product }))

const INHOUSE_COLORS = ['#286B43', '#3664E8', '#752DA8', '#D38A25', '#2A8C8C', '#E84855']

export const PAYMENT_STATUS_OPTIONS: { value: PaymentStatusValue; label: string; detail: string }[] = [
  { value: 'UNPAID', label: 'Not paid', detail: 'Customer pays later' },
  { value: 'PAID', label: 'Paid', detail: 'Paid in full' },
  { value: 'PARTIAL', label: 'Part paid', detail: 'Paid some of it' },
]

export const PAYMENT_METHOD_OPTIONS: { value: PaymentMethodValue; label: string; icon: IconName }[] = [
  { value: 'BANK', label: 'Bank transfer', icon: 'bank' },
  { value: 'CASH', label: 'Cash', icon: 'wallet' },
]

export function useCreateShipmentWizard() {
  const navigate = useNavigate()
  const live = isLive()
  const [step, setStep] = useState<WizardStep>(1)
  const [result, setResult] = useState<CreateShipmentResult | null>(null)
  const [checkoutLink, setCheckoutLink] = useState<string | null>(null)
  const { copied, copy } = useClipboard()

  const form = useForm<ShipmentFormValues>({ resolver: zodResolver(shipmentFormSchema), defaultValues: shipmentFormDefaults(), mode: 'onTouched' })
  const { control, register, setValue, getValues, trigger, handleSubmit, formState: { errors } } = form
  const { fields, append, remove, update } = useFieldArray({ control, name: 'products' })
  /** Right-side panel for adding/editing one package item (null index = new item). */
  const [itemPanel, setItemPanel] = useState<{ open: boolean; index: number | null }>({ open: false, index: null })
  const [products, method, customer, partnerId, payment] = useWatch({ control, name: ['products', 'method', 'customer', 'partnerId', 'payment'] })

  const itemsQuery = useItems()
  const addItem = useAddItem()
  const partnersQuery = useDeliveryPartners()
  const ratesMutation = useShipmentRates()
  const shipbubble = useShipbubbleSettings()
  const methodsQuery = useShippingMethods()
  const accountsQuery = useSettlementAccounts()
  const createShipment = useCreateShipment()
  const checkout = useCheckoutLink()
  const { data: settings } = useBusinessSettings()
  const pickupFull = settings?.shipping.location || ''
  const pickup = { label: settings?.shipping.business ? `${settings.shipping.business}${pickupFull ? `, ${shortAddress(pickupFull)}` : ''}` : shortAddress(pickupFull) || 'Your business address', full: [settings?.shipping.business, pickupFull].filter(Boolean).join(', ') || 'Add a pickup address in Settings › Shipping setup' }

  // Same switch as sink-inventory: an active Shipbubble connection books couriers, otherwise the business's own rates.
  const deliveryMode: DeliveryMode = !live ? 'mock' : shipbubble.data?.settings.isActive ? 'shipbubble' : 'inhouse'
  const isMerchant = method === 'merchant'
  const packageItems = toPackageItems(products)
  const quote = deliveryMode === 'shipbubble' && isMerchant ? ratesMutation.data : undefined

  /** In-house delivery rates shown in the same list as couriers; ids map back to shipping_id. */
  const inhouse = useMemo(() => {
    const methods = (methodsQuery.data ?? []).filter(item => item.visible)
    const rates: DeliveryPartner[] = methods.map((item, index) => ({ id: index + 1, name: item.location, full: item.location, initials: item.location.charAt(0).toUpperCase() || 'D', color: INHOUSE_COLORS[index % INHOUSE_COLORS.length], price: item.amount ?? 0, eta: item.description || 'Your own delivery', rating: '', tag: item.amount == null ? 'Price on request' : '' }))
    return { rates, methodIdFor: (id: number) => methods[id - 1]?.id }
  }, [methodsQuery.data])

  const rates = deliveryMode === 'shipbubble' ? (ratesMutation.data?.rates ?? []) : deliveryMode === 'inhouse' ? inhouse.rates : (partnersQuery.data ?? [])
  const ratesLoading = deliveryMode === 'shipbubble' ? ratesMutation.isPending : deliveryMode === 'inhouse' ? methodsQuery.isLoading || shipbubble.isLoading : partnersQuery.isLoading
  const ratesError = deliveryMode === 'shipbubble' ? ratesMutation.isError : deliveryMode === 'inhouse' ? methodsQuery.isError : partnersQuery.isError
  const partner = rates.find(item => item.id === partnerId) ?? rates[0]
  const deliveryFee = isMerchant ? (partner?.price ?? 0) : 0
  const total = packageTotal(packageItems)
  const orderTotal = total + deliveryFee
  const amountPaid = payment.status === 'PAID' ? orderTotal : payment.status === 'PARTIAL' ? Number(payment.amountPaid) || 0 : 0

  /** Checkout links open the storefront, so every item has to be listed there. */
  const hasItemsNotOnStore = live && products.some(item => !item.productId || (itemsQuery.data ?? []).find(saved => saved.productId === item.productId)?.listed === false)

  /** Live orders need saved products: typed items become products that stay off the storefront, reusing an identical one if it exists. */
  const saveTypedItems = async () => {
    if (!live) return true
    try {
      for (const [index, item] of getValues('products').entries()) {
        if (item.productId) continue
        const existing = (itemsQuery.data ?? []).find(saved => saved.productId && saved.name.toLowerCase() === item.name.toLowerCase() && Number(saved.price) === Number(item.amount) && Number(saved.weight) === Number(item.weight))
        const productId = existing?.productId ?? (await addItem.mutateAsync({ name: item.name, description: '', price: item.amount, weight: item.weight, image: '', available: true, listed: false })).productId
        setValue(`products.${index}.productId`, productId)
      }
      return true
    } catch (error) {
      toast.error(errorMessage(error, 'We couldn’t save your items. Please try again.'))
      return false
    }
  }

  /** Fetches Shipbubble quotes for the package and address, then preselects the first rate. */
  const requestLiveRates = () => {
    const values = getValues()
    ratesMutation.mutate(
      {
        products: toPackageItems(values.products).map(product => ({ productId: product.productId as string, quantity: Number(product.quantity) || 1 })),
        customer: { ...values.customer, email: values.customer.email.trim(), state: values.customer.state, city: values.customer.city.trim() || undefined },
        ...(values.note.trim() ? { note: values.note.trim() } : {}),
      },
      {
        onSuccess: data => {
          if (!data.rates.some(rate => rate.id === getValues('partnerId')) && data.rates[0]) setValue('partnerId', data.rates[0].id)
        },
        onError: error => toast.error(errorMessage(error, 'We couldn’t load delivery rates. Please try again.')),
      },
    )
  }

  const refreshRates = () => {
    if (deliveryMode === 'shipbubble') requestLiveRates()
    else if (deliveryMode === 'inhouse') methodsQuery.refetch()
    else partnersQuery.refetch()
  }

  /** Merchant flow: creates the order (Shipbubble or in-house) with the customer's payment. */
  const bookOrder = handleSubmit(
    async values => {
      if (!partner) return toast.error('Please select a delivery option')
      const inhouseMethodId = deliveryMode === 'inhouse' ? inhouse.methodIdFor(partner.id) : undefined
      if (deliveryMode === 'inhouse' && !inhouseMethodId) return toast.error('Please select a delivery rate')
      if (deliveryMode === 'inhouse' && !values.shippingDate) return toast.error('Choose the shipping date')
      try {
        const created = await createShipment.mutateAsync({
          ...values,
          paymentMethod: 'checkout',
          products: toPackageItems(values.products),
          quote,
          partnerId: partner.id,
          payment: {
            status: values.payment.status,
            method: values.payment.method,
            bankId: values.payment.bankId || undefined,
            amountPaid: values.payment.status === 'UNPAID' ? undefined : amountPaid,
          },
          inhouse: inhouseMethodId ? { shippingMethodId: inhouseMethodId, name: partner.full, fee: partner.price, shippingDate: values.shippingDate, note: values.note.trim() || undefined } : undefined,
        })
        setResult(created)
        setStep(5)
      } catch (error) {
        toast.error(errorMessage(error, 'We couldn’t create this order. Please try again.'))
      }
    },
    invalid => {
      toast.error('Please check the order details and try again.')
      if (invalid.products) setStep(1)
      else if (invalid.customer) setStep(2)
    },
  )

  /** Customer flow: builds the storefront checkout link the customer opens to buy and pay. */
  const createLink = () => {
    const link = checkout.buildLink(packageItems)
    if (!link) {
      toast.error('Set up your store link first so customers have somewhere to pay.', { action: { label: 'Open settings', onClick: () => navigate(settingsPath('Storefront')) } })
      return
    }
    setCheckoutLink(link)
    setStep(5)
  }

  const next = async () => {
    if (step === 1 && !(await trigger('products'))) return
    if (step === 2 && !isMerchant && hasItemsNotOnStore) return toast.error('Checkout links can only include items listed on your storefront.')
    if (step === 2 && isMerchant) {
      if (!(await trigger('customer'))) return
      if (!(await saveTypedItems())) return
      if (deliveryMode === 'shipbubble') requestLiveRates()
    }
    if (step === 4) {
      if (!isMerchant) return createLink()
      if (!(await trigger('payment'))) return
      return bookOrder()
    }
    setStep(current => (current + 1) as WizardStep)
  }

  const close = () => navigate(paths.dashboard)
  const back = () => (step === 1 ? close() : setStep(current => (current - 1) as WizardStep))

  const shareText = checkoutLink ? checkoutMessage(checkout.storeName, packageItems, checkoutLink) : ''
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  const canContinue =
    step === 1 ? products.length > 0 && products.every(item => item.name && item.weight)
      : step === 3 ? (!isMerchant || (Boolean(partner) && !ratesLoading))
        : step === 4 && !isMerchant ? !checkout.isLoading
          : true

  const primaryIcon: IconName = step === 4 ? (isMerchant ? 'truck' : 'link') : 'arrow'
  const primaryLabel = step === 4 ? (isMerchant ? (deliveryMode === 'shipbubble' ? 'Create order & book rider' : 'Create order') : 'Create checkout link') : 'Continue'

  const accounts = accountsQuery.data ?? []

  return {
    step,
    goToStep: (target: 1 | 2) => setStep(target),
    register,
    errors,
    // Package step
    fields,
    products,
    catalog: (itemsQuery.data ?? []).filter(item => item.inStock),
    catalogLoading: itemsQuery.isLoading,
    addProduct: () => setItemPanel({ open: true, index: null }),
    editProduct: (index: number) => setItemPanel({ open: true, index }),
    itemPanel: {
      open: itemPanel.open,
      isEdit: itemPanel.index !== null,
      initial: itemPanel.index !== null ? products[itemPanel.index] ?? emptyPackageItem() : emptyPackageItem(),
      close: () => setItemPanel(current => ({ ...current, open: false })),
      save: (values: PackageItemValues) => {
        if (itemPanel.index === null) append(values)
        else {
          const current = products[itemPanel.index]
          // A changed name, price or weight no longer matches the saved product, so it's saved again at booking.
          const changed = current.name !== values.name || current.amount !== values.amount || current.weight !== values.weight
          update(itemPanel.index, { ...current, ...values, productId: changed ? undefined : current.productId })
        }
        setItemPanel({ open: false, index: null })
      },
    },
    addFromCatalog: (item: CatalogItem) => append({ name: item.name, quantity: '1', amount: item.price, weight: item.weight, productId: item.productId }),
    removeProduct: remove,
    // Checkout method step
    method,
    setMethod: (value: CheckoutMethod) => setValue('method', value, { shouldDirty: true }),
    hasStoreLink: !live || checkout.hasStore,
    showStoreItemsNote: hasItemsNotOnStore,
    pickup,
    customer,
    stateOptions: NIGERIAN_STATES,
    // Delivery rate step
    deliveryMode,
    rates,
    ratesLoading,
    ratesError,
    refreshRates,
    isLiveQuote: deliveryMode === 'shipbubble',
    partner,
    partnerId,
    selectPartner: (id: number) => setValue('partnerId', id, { shouldDirty: true }),
    dropoffLabel: isMerchant ? shortAddress(customer.address) : 'Added by customer',
    goToShippingSettings: () => navigate(settingsPath('Shipping setup')),
    // Review step
    payment,
    setPaymentStatus: (value: PaymentStatusValue) => setValue('payment.status', value, { shouldDirty: true }),
    setPaymentMethod: (value: PaymentMethodValue) => setValue('payment.method', value, { shouldDirty: true }),
    bankOptions: accounts.map(account => ({ id: account.id, label: `${account.bankName} · ${account.accountNumber}` })),
    banksLoading: accountsQuery.isLoading,
    needsShippingDate: deliveryMode === 'inhouse',
    total,
    deliveryFee,
    orderTotal,
    amountPaid,
    balance: Math.max(orderTotal - amountPaid, 0),
    isMerchant,
    // Footer
    canContinue,
    next,
    back,
    backLabel: step === 1 ? 'Cancel' : 'Back',
    primaryLabel,
    primaryIcon,
    isSubmitting: createShipment.isPending || addItem.isPending,
    close,
    // Success screen
    result,
    checkoutLink,
    copied,
    copyLink: async () => { if (checkoutLink) await copy(checkoutLink) },
    shareOnWhatsApp: () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener'),
    canNativeShare,
    nativeShare: async () => {
      if (!checkoutLink || !canNativeShare) return
      try { await navigator.share({ title: 'Checkout link', text: shareText, url: checkoutLink }) } catch { /* dismissed */ }
    },
    openLink: () => { if (checkoutLink) window.open(checkoutLink, '_blank', 'noopener') },
    trackShipment: () => navigate(paths.tracking),
  }
}

export type CreateShipmentWizard = ReturnType<typeof useCreateShipmentWizard>
