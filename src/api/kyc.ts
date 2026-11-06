import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest, mockDelay } from '@/lib/api-client'
import { fetchCurrentBusiness, requireBusinessId, useCurrentBusinessId, type Business } from './business'
import { apiFormRequest, asRecord, at, isLive, str, type UnknownRecord } from './http'
import { queryKeys } from './query-keys'
import { fetchWalletPage } from './wallet'

/**
 * KYC / wallet-account verification — same backend flow as sink-inventory:
 *
 *  POST wallet/create_bank_account/{business_id}/        opens the account (individual Tier 1, corporate Tier 1)
 *  POST wallet/upgrade_account/{bank_id}/                individual Tier 2/3 — JSON { bvn?, nin?, address? }
 *  POST wallet/upgrade_corporate_account/{bank_id}/      corporate Tier 2 — multipart (TIN, CAC docs, directors)
 *  GET  wallet/upgrade_corporate_account/{bank_id}/      what the company has filed + review status
 *  GET  wallet/{bank_id}/                                verification state (tier, nin, bvn, address, account_type)
 *
 * Upgrades are keyed on the wallet's bank id (the business's primary bank), not
 * the business — the endpoint 404s with "No BankAccount matches" otherwise.
 */

export const kycKeys = {
  status: ['kyc', 'status'] as const,
  corporate: ['kyc', 'corporate'] as const,
}

export type AccountType = 'individual' | 'corporate'
export type IdentityMethod = 'nin' | 'bvn'

export type KycStatus = {
  /** Wallet bank id the upgrade endpoints are keyed on. Null until the account is opened. */
  bankId: string | null
  /** 0 until the account has been tiered. */
  tier: number
  tierLabel: string | null
  accountType: AccountType | null
  hasNin: boolean
  hasBvn: boolean
  hasAddress: boolean
  completedTiers: number[]
  corporateCompletedTiers: number[]
  /** Provider review state, null until reviewed. */
  verificationStatus: string | null
  hasStarted: boolean
  /** The identifier Tier 2 still needs; null when both or neither are on file. */
  missingIdentity: IdentityMethod | null
  /** Business-level flag the online-payments toggle is gated on. */
  businessVerified: boolean
}

export type CorporateReview = {
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | null
  submittedAt: string | null
  /** Document keys already on file (the API returns each as a URL). */
  filedDocuments: string[]
}

export type CreateAccountInput = UnknownRecord & { type: 'INDIVIDUAL' | 'CORPORATE' }
export type IndividualUpgradeInput = { bvn?: string; nin?: string; address?: string }

// ─── Mapping ────────────────────────────────────────────────────────────────

const parseTier = (tier: string | null) => {
  const match = /(\d+)/.exec(tier ?? '')
  return match ? Number(match[1]) : 0
}

export const buildKycStatus = (account: UnknownRecord, bankId: string | null, businessVerified: boolean): KycStatus => {
  const hasNin = Boolean(str(account.nin))
  const hasBvn = Boolean(str(account.bvn))
  const hasAddress = Boolean(str(account.address))
  const wallet = asRecord(account.wallet_details)
  const tierLabel = str(account.tier) || null
  const tier = parseTier(tierLabel)
  const rawType = (str(account.account_type) || str(wallet.account_type)).toUpperCase()
  const accountType: AccountType | null = rawType === 'CORPORATE' ? 'corporate' : rawType === 'INDIVIDUAL' ? 'individual' : null

  const completedTiers: number[] = []
  if (hasNin || hasBvn) completedTiers.push(1)
  if (hasNin && hasBvn) completedTiers.push(2)
  if (hasNin && hasBvn && hasAddress) completedTiers.push(3)

  // The account reports one tier; only read it as corporate progress on a corporate account.
  const corporateCompletedTiers = accountType === 'corporate' ? [1, 2].filter(level => tier >= level) : []

  return {
    bankId,
    tier,
    tierLabel,
    accountType,
    hasNin,
    hasBvn,
    hasAddress,
    completedTiers,
    corporateCompletedTiers,
    verificationStatus: str(account.verification_status) || null,
    hasStarted: Object.keys(wallet).length > 0 || completedTiers.length > 0 || corporateCompletedTiers.length > 0,
    missingIdentity: hasNin === hasBvn ? null : hasNin ? 'bvn' : 'nin',
    businessVerified,
  }
}

const primaryBankId = (business: Business) => (business.banks.find(bank => !bank.is_sub) ?? business.banks[0])?.id ?? null

// ─── Sample data (VITE_AUTH_MODE=mock) ──────────────────────────────────────

const mock: { account: UnknownRecord; corporate: CorporateReview | null } = { account: {}, corporate: null }
const mockStatus = () => buildKycStatus(mock.account, Object.keys(mock.account).length ? 'mock-bank' : null, Boolean(mock.account.tier))

// ─── Services ───────────────────────────────────────────────────────────────

const getStatus = async (): Promise<KycStatus> => {
  if (!isLive()) return mockDelay(mockStatus())
  const business = await fetchCurrentBusiness()
  const bankId = primaryBankId(business)
  const businessVerified = business.raw.kyc === true
  if (!bankId) return buildKycStatus({}, null, businessVerified)
  // Same cached request as the wallet overview (one GET wallet/{bank_id}/ per bank).
  const response = await fetchWalletPage(bankId)
  return buildKycStatus(asRecord(asRecord(response).results), bankId, businessVerified)
}

const getCorporateReview = async (bankId: string): Promise<CorporateReview> => {
  if (!isLive()) return mockDelay(mock.corporate ?? { status: null, submittedAt: null, filedDocuments: [] })
  const response = await apiRequest<unknown>(`wallet/upgrade_corporate_account/${bankId}/`)
  const record = asRecord(at(response, 'data') ?? response)
  const status = str(record.status).toUpperCase()
  return {
    status: status === 'PENDING' || status === 'APPROVED' || status === 'REJECTED' ? status : null,
    submittedAt: str(record.created_at) || null,
    filedDocuments: Object.entries(record).filter(([, value]) => typeof value === 'string' && /^https?:\/\//.test(value)).map(([key]) => key),
  }
}

/** Opens the wallet account. The response may carry a hosted provider page in data.url. */
const createAccount = async (body: CreateAccountInput): Promise<{ url: string | null }> => {
  if (!isLive()) {
    mock.account = { ...mock.account, ...body, tier: 'TIER 1', account_type: body.type, wallet_details: { account_type: body.type } }
    return mockDelay({ url: null }, 700)
  }
  const response = await apiRequest<unknown>(`wallet/create_bank_account/${requireBusinessId()}/`, { method: 'POST', body })
  return { url: str(at(response, 'data.url')) || str(at(response, 'url')) || null }
}

const upgradeIndividual = async ({ bankId, body }: { bankId: string; body: IndividualUpgradeInput }) => {
  if (!isLive()) {
    mock.account = { ...mock.account, ...body }
    const next = buildKycStatus(mock.account, 'mock-bank', true)
    mock.account.tier = `TIER ${Math.max(...next.completedTiers, 1)}`
    return mockDelay(null, 700)
  }
  return apiRequest<unknown>(`wallet/upgrade_account/${bankId}/`, { method: 'POST', body })
}

const upgradeCorporate = async ({ bankId, form }: { bankId: string; form: FormData }) => {
  if (!isLive()) {
    mock.corporate = { status: 'PENDING', submittedAt: new Date().toISOString(), filedDocuments: [...form.keys()] }
    return mockDelay(null, 900)
  }
  return apiFormRequest<unknown>(`wallet/upgrade_corporate_account/${bankId}/`, 'POST', form)
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

/** Where the account stands: tier, which identifiers are on file, account type. */
export const useKycStatus = () => {
  const { businessId } = useCurrentBusinessId()
  return useQuery({
    queryKey: [...kycKeys.status, isLive() ? businessId : 'mock'],
    queryFn: getStatus,
    enabled: !isLive() || Boolean(businessId),
  })
}

/** Corporate Tier 2 filing + review state. Only fetched once the account exists. */
export const useCorporateReview = (bankId: string | null, enabled: boolean) =>
  useQuery({
    queryKey: [...kycKeys.corporate, bankId],
    queryFn: () => getCorporateReview(bankId as string),
    enabled: enabled && Boolean(bankId),
  })

const useInvalidateKyc = () => {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['kyc'] })
    queryClient.invalidateQueries({ queryKey: queryKeys.business })
    queryClient.invalidateQueries({ queryKey: queryKeys.wallet })
    queryClient.invalidateQueries({ queryKey: queryKeys.settings })
  }
}

export const useCreateKycAccount = () => {
  const invalidate = useInvalidateKyc()
  return useMutation({ mutationFn: createAccount, onSuccess: invalidate })
}

export const useUpgradeIndividualAccount = () => {
  const invalidate = useInvalidateKyc()
  return useMutation({ mutationFn: upgradeIndividual, onSuccess: invalidate })
}

export const useUpgradeCorporateAccount = () => {
  const invalidate = useInvalidateKyc()
  return useMutation({ mutationFn: upgradeCorporate, onSuccess: invalidate })
}
