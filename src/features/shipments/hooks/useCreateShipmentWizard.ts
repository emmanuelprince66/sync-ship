import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { isLive } from '@/api/http'
import { useItems } from '@/api/items'
import { useBusinessSettings } from '@/api/settings'
import { canQuoteLive, packageTotal, useCreateShipment, useDeliveryPartners, useShipmentRates } from '@/api/shipments'
import type { CatalogItem, CheckoutMethod, CreateShipmentResult, PackageItem, PaymentMethod } from '@/api/types'
import { useWallet } from '@/api/wallet'
import type { IconName } from '@/components/ui/Icon'
import { useClipboard } from '@/hooks/useClipboard'
import { formatNaira } from '@/lib/format'
import { paths } from '@/routes/paths'
import { NIGERIAN_STATES } from '../constants'
import { emptyPackageItem, shipmentFormDefaults, shipmentFormSchema, type PackageItemValues, type ShipmentFormValues } from '../schemas'
import { shortAddress } from '../utils'

export const WIZARD_STEPS = ['Package details', 'Checkout method', 'Delivery rate', 'Review'] as const
/** 1–4 are the wizard steps, 5 is the success screen. */
export type WizardStep = 1 | 2 | 3 | 4 | 5

const toPackageItems = (products: PackageItemValues[]): PackageItem[] => products.map((product, index) => ({ id: index + 1, ...product }))

export function useCreateShipmentWizard() {
  const navigate = useNavigate()
  const [step, setStep] = useState<WizardStep>(1)
  const [result, setResult] = useState<CreateShipmentResult | null>(null)
  const { copied, copy } = useClipboard()

  const form = useForm<ShipmentFormValues>({ resolver: zodResolver(shipmentFormSchema), defaultValues: shipmentFormDefaults, mode: 'onTouched' })
  const { control, register, setValue, getValues, trigger, handleSubmit, formState: { errors } } = form
  const { fields, append, remove } = useFieldArray({ control, name: 'products' })
  const [products, method, paymentMethod, customer, partnerId] = useWatch({ control, name: ['products', 'method', 'paymentMethod', 'customer', 'partnerId'] })

  const itemsQuery = useItems()
  const partnersQuery = useDeliveryPartners()
  const ratesMutation = useShipmentRates()
  const { data: wallet } = useWallet()
  const createShipment = useCreateShipment()
  const { data: settings } = useBusinessSettings()
  const pickupFull = settings?.shipping.location || ''
  const pickup = { label: settings?.shipping.business ? `${settings.shipping.business}${pickupFull ? `, ${shortAddress(pickupFull)}` : ''}` : shortAddress(pickupFull) || 'Your business address', full: [settings?.shipping.business, pickupFull].filter(Boolean).join(', ') || 'Add a pickup address in Settings › Shipping setup' }

  const isMerchant = method === 'merchant'
  const packageItems = toPackageItems(products)
  // Live quotes need catalog products and a full delivery address, so only the merchant flow can use them.
  const quotable = canQuoteLive(packageItems)
  const useLiveRates = isMerchant && quotable
  const quote = useLiveRates ? ratesMutation.data : undefined

  const rates = useLiveRates ? (ratesMutation.data?.rates ?? []) : (partnersQuery.data ?? [])
  const ratesLoading = useLiveRates ? ratesMutation.isPending : partnersQuery.isLoading
  const ratesError = useLiveRates ? ratesMutation.isError : partnersQuery.isError
  const partner = rates.find(item => item.id === partnerId) ?? rates[0]
  const deliveryFee = partner?.price ?? 0
  const total = packageTotal(packageItems)
  const payable = isMerchant ? deliveryFee : total + deliveryFee

  /** Fetches live courier quotes for the current package and address, then preselects the first rate. */
  const requestLiveRates = () => {
    const values = getValues()
    ratesMutation.mutate(
      {
        products: toPackageItems(values.products).map(product => ({ productId: product.productId as string, quantity: Number(product.quantity) || 1 })),
        customer: { ...values.customer, email: values.customer.email.trim(), state: values.customer.state, city: values.customer.city.trim() || undefined },
      },
      {
        onSuccess: data => {
          if (!data.rates.some(rate => rate.id === getValues('partnerId')) && data.rates[0]) setValue('partnerId', data.rates[0].id)
        },
        onError: error => toast.error(errorMessage(error, 'We couldn’t load delivery rates. Please try again.')),
      },
    )
  }

  const refreshRates = () => (useLiveRates ? requestLiveRates() : partnersQuery.refetch())

  const submit = handleSubmit(
    async values => {
      if (!partner) return toast.error('Please select a delivery option')
      try {
        const created = await createShipment.mutateAsync({
          ...values,
          products: toPackageItems(values.products),
          quote,
          partnerId: partner.id,
          orderPaymentStatus: isMerchant && values.paymentMethod === 'wallet' ? 'PAID' : undefined,
        })
        setResult(created)
        setStep(5)
      } catch (error) {
        toast.error(errorMessage(error, 'We couldn’t create this shipment. Please try again.'))
      }
    },
    invalid => {
      toast.error('Please check the shipment details and try again.')
      if (invalid.products) setStep(1)
      else if (invalid.customer) setStep(2)
    },
  )

  const next = async () => {
    if (step === 1 && !(await trigger('products'))) return
    if (step === 2) {
      if (isMerchant && !(await trigger('customer'))) return
      if (useLiveRates) requestLiveRates()
    }
    if (step === 4) return submit()
    setStep(current => (current + 1) as WizardStep)
  }

  const close = () => navigate(paths.dashboard)
  const back = () => (step === 1 ? close() : setStep(current => (current - 1) as WizardStep))

  const copyLink = async () => {
    if (result?.checkoutLink) await copy(`https://${result.checkoutLink}`)
  }

  const canContinue =
    step === 1 ? products.length > 0 && products.every(item => item.name && item.weight)
      : step === 3 ? Boolean(partner) && !ratesLoading
        : true

  const primaryIcon: IconName = step === 4 ? (isMerchant ? 'truck' : 'link') : 'arrow'
  const primaryLabel = step === 4 ? (isMerchant ? `Pay ${formatNaira(deliveryFee)} & book` : 'Create checkout link') : 'Continue'

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
    showEstimateNote: isLive() && products.length > 0 && !quotable,
    addProduct: () => append(emptyPackageItem()),
    addFromCatalog: (item: CatalogItem) => append({ name: item.name, quantity: '1', amount: item.price, weight: item.weight, length: '', width: '', productId: item.productId }),
    removeProduct: remove,
    // Checkout method step
    method,
    setMethod: (value: CheckoutMethod) => { if (value === 'customer' && isLive()) return; setValue('method', value, { shouldDirty: true }) },
    /** Customer checkout links have no backend endpoint yet, so the option is shown as coming soon in live mode. */
    customerLinkAvailable: !isLive(),
    pickup,
    /** Live mode without catalog items: there are no rates to show (no sample partners). */
    needsCatalogItems: isLive() && !useLiveRates,
    customer,
    stateOptions: NIGERIAN_STATES,
    // Delivery rate step
    rates,
    ratesLoading,
    ratesError,
    refreshRates,
    isLiveQuote: useLiveRates,
    partner,
    partnerId,
    selectPartner: (id: number) => setValue('partnerId', id, { shouldDirty: true }),
    dropoffLabel: isMerchant ? shortAddress(customer.address) : 'Added by customer',
    // Review step
    paymentMethod,
    setPaymentMethod: (value: PaymentMethod) => setValue('paymentMethod', value, { shouldDirty: true }),
    walletBalanceLabel: formatNaira(wallet?.balance ?? 0),
    total,
    deliveryFee,
    payable,
    isMerchant,
    // Footer
    canContinue,
    next,
    back,
    backLabel: step === 1 ? 'Cancel' : 'Back',
    primaryLabel,
    primaryIcon,
    isSubmitting: createShipment.isPending,
    close,
    // Success screen
    result,
    copied,
    copyLink,
    trackShipment: () => navigate(paths.tracking),
    previewCheckout: () => navigate(paths.storefront),
  }
}

export type CreateShipmentWizard = ReturnType<typeof useCreateShipmentWizard>
