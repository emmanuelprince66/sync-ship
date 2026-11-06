import { useState } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useOnlinePayments, useSaveOnlinePayments, type OnlinePayments } from '@/api/banks'
import { isLive } from '@/api/http'
import { useKycStatus } from '@/api/kyc'
import { useSaveSettings } from '@/api/settings'
import type { PaymentSettings } from '@/api/types'
import { useDisclosure } from '@/hooks/useDisclosure'
import { CORPORATE_TIERS, INDIVIDUAL_TIERS } from '../constants'

type Draft = { online: boolean; chargesPaidBy: OnlinePayments['chargesPaidBy']; wallet: boolean }

/**
 * Payments & KYC tab. Online payments (live: allow_online_payment +
 * pay_transaction_charges, gated on KYC like sink-inventory) and the wallet
 * toggle (sample data) share the tab's Save button; KYC and bank accounts act
 * through their own dialogs.
 */
export const usePaymentsSection = (initial: PaymentSettings) => {
  const kyc = useKycStatus()
  const online = useOnlinePayments()
  const saveOnline = useSaveOnlinePayments()
  const saveSettings = useSaveSettings()
  const kycModal = useDisclosure()
  const [draft, setDraft] = useState<Draft | null>(null)

  const server: Draft | null = online.data ? { online: online.data.enabled, chargesPaidBy: online.data.chargesPaidBy, wallet: initial.wallet } : null
  const current = draft ?? server
  const status = kyc.data
  const verified = Boolean(online.data?.kycVerified || (status && status.tier > 0))

  const tiers = status?.accountType === 'corporate' ? CORPORATE_TIERS : INDIVIDUAL_TIERS
  const tierInfo = tiers.find(tier => tier.tier === status?.tier)
  const fullyVerified = Boolean(status && status.tier >= tiers[tiers.length - 1].tier)

  const update = (patch: Partial<Draft>) => current && setDraft({ ...current, ...patch })

  const setOnline = (enabled: boolean) => {
    if (enabled && !verified) {
      toast.info('Complete KYC Tier 1 to accept online payments')
      kycModal.open()
      return
    }
    update({ online: enabled })
  }

  const save = () => {
    if (!current) return
    const requests = [
      saveOnline.mutateAsync({ enabled: current.online, chargesPaidBy: current.chargesPaidBy }),
      saveSettings.mutateAsync({ payments: { ...initial, online: current.online, wallet: current.wallet } }),
    ]
    Promise.all(requests)
      .then(() => { setDraft(null); toast.success('Payment settings saved') })
      .catch(error => toast.error(errorMessage(error)))
  }

  return {
    isLoading: online.isLoading || kyc.isLoading,
    draft: current,
    setOnline,
    setChargesPaidBy: (chargesPaidBy: Draft['chargesPaidBy']) => update({ chargesPaidBy }),
    setWallet: (wallet: boolean) => update({ wallet }),
    /** Live: the wallet opens with KYC (wallet/create_bank_account), so it's a status, not a switch. */
    walletReadOnly: isLive(),
    walletActive: initial.wallet,
    save,
    saving: saveOnline.isPending || saveSettings.isPending,
    kyc: {
      started: Boolean(status?.hasStarted),
      verified,
      fullyVerified,
      tierLabel: status?.tier ? `Tier ${status.tier}` : null,
      limit: tierInfo ? `${tierInfo.limit} daily limit` : 'Withdrawals locked until Tier 1',
      badge: fullyVerified ? 'Verified' : status?.tier ? `Tier ${status.tier} of ${tiers.length}` : status?.hasStarted ? 'In progress' : 'Not started',
      modal: kycModal,
    },
  }
}
