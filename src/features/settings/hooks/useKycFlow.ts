import { zodResolver } from '@hookform/resolvers/zod'
import { useRef, useState } from 'react'
import { useForm, type FieldPath } from 'react-hook-form'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useCorporateReview, useCreateKycAccount, useKycStatus, useUpgradeCorporateAccount, useUpgradeIndividualAccount, type AccountType, type IdentityMethod } from '@/api/kyc'
import { CORPORATE_DOCUMENTS, CORPORATE_TIERS, DIRECTOR_DOCUMENTS, INDIVIDUAL_TIERS, MAX_DOCUMENT_MB, type CorporateDocKey, type DirectorDocKey } from '../constants'
import { corporateKycDefaults, corporateKycSchema, ELEVEN_DIGITS, individualKycDefaults, individualKycSchema, type CorporateKycValues, type IndividualKycValues } from '../schemas'

export type Director = { id: string; name: string; files: Record<DirectorDocKey, File | null> }
export type DirectorErrors = Partial<Record<'name' | DirectorDocKey, string>>
export type TierState = 'done' | 'current' | 'locked'

export const IDENTITY_SHORT: Record<IdentityMethod, string> = { nin: 'NIN', bvn: 'BVN' }

const emptyDirectorFiles = () => Object.fromEntries(DIRECTOR_DOCUMENTS.map(doc => [doc.key, null])) as Record<DirectorDocKey, File | null>
const emptyCorporateDocs = () => Object.fromEntries(CORPORATE_DOCUMENTS.map(doc => [doc.key, null])) as Record<CorporateDocKey, File | null>

/** "1990-04-12" → "12-Apr-1990", the format create_bank_account expects. */
const toApiDate = (value: string) => {
  if (!value) return undefined
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return undefined
  return `${String(date.getDate()).padStart(2, '0')}-${date.toLocaleString('en-US', { month: 'short' })}-${date.getFullYear()}`
}

/** Drops empty values so the provider never receives "". */
const compact = (payload: Record<string, unknown>) => Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined && value !== ''))

const tooLarge = (file: File) => file.size > MAX_DOCUMENT_MB * 1024 * 1024

/**
 * KYC flow (ported from sink-inventory's useKycHook): individual accounts climb
 * three tiers (NIN or BVN → both → address); companies file business details,
 * then CAC documents, TIN and directors. Tier 1 opens the account through
 * create_bank_account; later tiers upgrade the existing wallet account.
 */
export function useKycFlow({ onFinished }: { onFinished?: () => void } = {}) {
  const statusQuery = useKycStatus()
  const status = statusQuery.data
  const [chosenType, setChosenType] = useState<AccountType | null>(null)
  const accountType = status?.accountType ?? chosenType
  const review = useCorporateReview(status?.bankId ?? null, accountType === 'corporate')

  const createAccount = useCreateKycAccount()
  const upgradeIndividual = useUpgradeIndividualAccount()
  const upgradeCorporate = useUpgradeCorporateAccount()
  const submitting = createAccount.isPending || upgradeIndividual.isPending || upgradeCorporate.isPending

  const individualForm = useForm<IndividualKycValues>({ resolver: zodResolver(individualKycSchema), defaultValues: individualKycDefaults })
  const corporateForm = useForm<CorporateKycValues>({ resolver: zodResolver(corporateKycSchema), defaultValues: corporateKycDefaults })

  // ── Individual: which identifier Tier 1 uses, and what Tier 2 still needs ──
  const [identityMethod, setIdentityMethodState] = useState<IdentityMethod>('nin')
  const setIdentityMethod = (method: IdentityMethod) => {
    setIdentityMethodState(method)
    const other: IdentityMethod = method === 'nin' ? 'bvn' : 'nin'
    individualForm.setValue(other, '')
    individualForm.clearErrors(other)
  }
  const tier2Identity: IdentityMethod = status?.missingIdentity ?? (identityMethod === 'nin' ? 'bvn' : 'nin')

  // ── Corporate documents and directors (files live outside react-hook-form) ──
  const [documents, setDocuments] = useState(emptyCorporateDocs)
  const [documentErrors, setDocumentErrors] = useState<Partial<Record<CorporateDocKey, string>>>({})
  const nextDirectorId = useRef(1)
  const [directors, setDirectors] = useState<Director[]>(() => [{ id: 'director-0', name: '', files: emptyDirectorFiles() }])
  const [directorErrors, setDirectorErrors] = useState<Record<string, DirectorErrors>>({})

  const setDocument = (key: CorporateDocKey, file: File | null) => {
    if (file && tooLarge(file)) return toast.error(`Files must be ${MAX_DOCUMENT_MB} MB or smaller`)
    setDocuments(current => ({ ...current, [key]: file }))
    setDocumentErrors(current => ({ ...current, [key]: undefined }))
  }

  const clearDirectorError = (id: string, field: keyof DirectorErrors) =>
    setDirectorErrors(current => ({ ...current, [id]: { ...current[id], [field]: undefined } }))

  const directorActions = {
    add: () => setDirectors(current => [...current, { id: `director-${nextDirectorId.current++}`, name: '', files: emptyDirectorFiles() }]),
    /** The first director is the primary contact and stays. */
    remove: (id: string) => setDirectors(current => (current.length === 1 ? current : current.filter(director => director.id !== id))),
    rename: (id: string, name: string) => {
      setDirectors(current => current.map(director => (director.id === id ? { ...director, name } : director)))
      clearDirectorError(id, 'name')
    },
    setFile: (id: string, key: DirectorDocKey, file: File | null) => {
      if (file && tooLarge(file)) return toast.error(`Files must be ${MAX_DOCUMENT_MB} MB or smaller`)
      setDirectors(current => current.map(director => (director.id === id ? { ...director, files: { ...director.files, [key]: file } } : director)))
      clearDirectorError(id, key)
    },
  }

  // ── Tier progress ──
  const completed = (accountType === 'corporate' ? status?.corporateCompletedTiers : status?.completedTiers) ?? []
  const tiers = accountType === 'corporate' ? CORPORATE_TIERS : INDIVIDUAL_TIERS
  const activeTier = tiers.find(tier => !completed.includes(tier.tier))?.tier ?? null
  const tierStates = tiers.map(tier => ({ ...tier, state: (completed.includes(tier.tier) ? 'done' : tier.tier === activeTier ? 'current' : 'locked') as TierState }))
  const accountOpened = completed.includes(1)

  const openProviderPage = (url: string | null) => { if (url) window.open(url, '_blank', 'noopener,noreferrer') }

  const accepted = (message: string) => {
    toast.success(message)
    if (activeTier === tiers[tiers.length - 1].tier) onFinished?.()
  }

  // ── Individual submit ──
  const validateIndividual = (tier: number, values: IndividualKycValues) => {
    const setError = (field: FieldPath<IndividualKycValues>, message: string) => individualForm.setError(field, { type: 'manual', message })
    let ok = true
    if (!accountOpened) {
      if (!values.first_name.trim()) { setError('first_name', 'First name is required'); ok = false }
      if (!values.last_name.trim()) { setError('last_name', 'Last name is required'); ok = false }
      if (!values.dob) { setError('dob', 'Date of birth is required'); ok = false }
    }
    const checkIdentity = (field: IdentityMethod) => {
      if (!ELEVEN_DIGITS.test(values[field])) { setError(field, `Enter the 11-digit ${IDENTITY_SHORT[field]}`); ok = false }
    }
    if (tier === 1) checkIdentity(identityMethod)
    if (tier === 2) checkIdentity(tier2Identity)
    if (tier === 3) {
      if (!values.address.trim()) { setError('address', 'Enter your residential address'); ok = false }
      if (!values.state) { setError('state', 'Choose your state'); ok = false }
    }
    return ok
  }

  const submitIndividual = () => {
    if (!activeTier) return
    const values = individualForm.getValues()
    individualForm.clearErrors()
    if (!validateIndividual(activeTier, values)) return toast.error('Check the highlighted fields and try again')

    if (activeTier === 1) {
      createAccount.mutate(compact({ type: 'INDIVIDUAL', first_name: values.first_name.trim(), last_name: values.last_name.trim(), dob: toApiDate(values.dob), [identityMethod]: values[identityMethod] }) as { type: 'INDIVIDUAL' }, {
        onSuccess: ({ url }) => { accepted('Tier 1 verification submitted'); openProviderPage(url) },
        onError: error => toast.error(errorMessage(error)),
      })
      return
    }
    if (!status?.bankId) return toast.error('Your wallet account is still being set up. Try again in a moment.')
    const address = [values.address.trim(), values.city.trim(), values.state].filter(Boolean).join(', ')
    const body = activeTier === 2 ? { [tier2Identity]: values[tier2Identity].trim() } : { address }
    upgradeIndividual.mutate({ bankId: status.bankId, body }, {
      onSuccess: () => accepted(`Tier ${activeTier} verification submitted`),
      onError: error => toast.error(errorMessage(error)),
    })
  }

  // ── Corporate submit ──
  const validateCorporateTier1 = (values: CorporateKycValues) => {
    let ok = true
    const required: [FieldPath<CorporateKycValues>, string][] = [
      ['firstname', 'First name is required'], ['lastname', 'Last name is required'], ['business_name', 'Business name is required'],
      ['registration_number', 'RC / BN number is required'], ['address', 'Business address is required'], ['state', 'State is required'], ['business_type', 'Choose the business type'],
    ]
    for (const [field, message] of required) {
      if (!String(values[field] ?? '').trim()) { corporateForm.setError(field, { type: 'manual', message }); ok = false }
    }
    if (!ELEVEN_DIGITS.test(values.bvn)) { corporateForm.setError('bvn', { type: 'manual', message: 'Enter the director’s 11-digit BVN' }); ok = false }
    return ok
  }

  const validateCorporateTier2 = (values: CorporateKycValues) => {
    let ok = true
    if (!values.tin.trim()) { corporateForm.setError('tin', { type: 'manual', message: 'Tax Identification Number is required' }); ok = false }
    const docErrors: Partial<Record<CorporateDocKey, string>> = {}
    for (const doc of CORPORATE_DOCUMENTS) if (!documents[doc.key]) { docErrors[doc.key] = 'Required'; ok = false }
    setDocumentErrors(docErrors)
    const nextErrors: Record<string, DirectorErrors> = {}
    for (const director of directors) {
      const errors: DirectorErrors = {}
      if (!director.name.trim()) errors.name = 'Full name is required'
      for (const doc of DIRECTOR_DOCUMENTS) if (!director.files[doc.key]) errors[doc.key] = 'Required'
      if (Object.keys(errors).length) { nextErrors[director.id] = errors; ok = false }
    }
    setDirectorErrors(nextErrors)
    return ok
  }

  const submitCorporate = () => {
    if (!activeTier) return
    const values = corporateForm.getValues()
    corporateForm.clearErrors()
    const valid = activeTier === 1 ? validateCorporateTier1(values) : validateCorporateTier2(values)
    if (!valid) return toast.error('Check the highlighted fields and try again')

    if (activeTier === 1) {
      createAccount.mutate(compact({
        type: 'CORPORATE', bvn: values.bvn, firstname: values.firstname.trim(), lastname: values.lastname.trim(), dob: toApiDate(values.dob),
        business_name: values.business_name.trim(), registration_number: values.registration_number.trim(), reg_date: toApiDate(values.reg_date),
        address: values.address.trim(), state: values.state, business_type: values.business_type,
      }) as { type: 'CORPORATE' }, {
        onSuccess: ({ url }) => { toast.success('Business details submitted'); openProviderPage(url) },
        onError: error => toast.error(errorMessage(error)),
      })
      return
    }
    if (!status?.bankId) return toast.error('Your wallet account is still being set up. Try again in a moment.')
    // Directors are repeated `directors` entries (one JSON object each), matched to files by index.
    const form = new FormData()
    form.append('tin', values.tin.trim())
    for (const doc of CORPORATE_DOCUMENTS) { const file = documents[doc.key]; if (file) form.append(doc.key, file) }
    directors.forEach((director, index) => {
      form.append('directors', JSON.stringify({ fullname: director.name.trim() }))
      for (const doc of DIRECTOR_DOCUMENTS) { const file = director.files[doc.key]; if (file) form.append(`director_${index}_${doc.key}`, file) }
    })
    upgradeCorporate.mutate({ bankId: status.bankId, form }, {
      onSuccess: () => toast.success('Company documents submitted for review'),
      onError: error => toast.error(errorMessage(error)),
    })
  }

  const reviewState = review.data?.status ?? null
  const corporateUnderReview = accountType === 'corporate' && (reviewState === 'PENDING' || reviewState === 'APPROVED')

  return {
    isLoading: statusQuery.isLoading,
    status,
    accountType,
    chooseAccountType: setChosenType,
    /** Let the user switch path only before the account has been opened. */
    canChangeType: !status?.accountType,
    tiers: tierStates,
    activeTier,
    activeTierInfo: tierStates.find(tier => tier.tier === activeTier) ?? null,
    accountOpened,
    isComplete: activeTier === null,
    corporateReview: {
      state: reviewState,
      submittedLabel: review.data?.submittedAt ? new Date(review.data.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : null,
      underReview: corporateUnderReview,
    },
    individual: { form: individualForm, identityMethod, setIdentityMethod, tier2Identity, submit: submitIndividual },
    corporate: { form: corporateForm, documents, documentErrors, setDocument, directors, directorErrors, directorActions, submit: submitCorporate, documentsCount: CORPORATE_DOCUMENTS.filter(doc => documents[doc.key]).length },
    submitting,
  }
}

export type KycFlow = ReturnType<typeof useKycFlow>
