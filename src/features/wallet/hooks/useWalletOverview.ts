import { useNavigate } from 'react-router'
import { useWallet, useWalletBanks } from '@/api/wallet'
import { paths, settingsPath } from '@/routes/paths'
import { formatBalance } from '../format'

export const useWalletOverview = () => {
  const navigate = useNavigate()
  const { data: wallet, isLoading } = useWallet()
  const banks = useWalletBanks()
  return {
    wallet,
    isLoading: isLoading || !wallet,
    balanceLabel: wallet ? formatBalance(wallet.balance) : '',
    recentTransactions: wallet?.transactions.slice(0, 5) ?? [],
    banks,
    viewAllTransactions: () => navigate(paths.walletTransactions),
    goToWithdraw: () => navigate(paths.withdraw),
    goToFund: () => navigate(paths.fundWallet),
    editWithdrawalAccount: () => navigate(settingsPath('Payments & KYC')),
  }
}
