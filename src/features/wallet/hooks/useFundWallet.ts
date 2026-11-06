import { useNavigate } from 'react-router'
import { useWallet } from '@/api/wallet'
import { useClipboard } from '@/hooks/useClipboard'
import { paths, settingsPath } from '@/routes/paths'

export const FUND_STEPS = ['Copy the virtual account number above', 'Transfer from your bank app or USSD', 'Your SyncShip wallet updates automatically']

export const useFundWallet = () => {
  const navigate = useNavigate()
  const { data: wallet, isLoading } = useWallet()
  const { copied, copy } = useClipboard()

  const copyAccountNumber = () => {
    if (wallet) copy(wallet.virtualAccount.number.replace(/\s/g, ''))
  }

  return {
    account: wallet?.virtualAccount,
    isLoading: isLoading || !wallet,
    copied,
    copyAccountNumber,
    hasAccount: Boolean(wallet?.virtualAccount.number),
    backToWallet: () => navigate(paths.wallet),
    goToKyc: () => navigate(settingsPath('Payments & KYC')),
  }
}
