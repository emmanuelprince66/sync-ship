import { Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { AppLoader } from '@/components/ui/AppLoader'
import { GuestOnly, RequireAuth, RequireBusiness } from './guards'
import { pages } from './pages'
import { paths } from './paths'

const { AuthPage, SelectBusinessPage, DashboardPage, ShipmentsPage, CreateShipmentPage, ItemsPage, StorefrontPage, WalletPage, FundWalletPage, WithdrawPage, WalletTransactionsPage, SettingsPage } = pages

export const router = createBrowserRouter([
  {
    element: <GuestOnly/>,
    children: [
      { path: paths.login, element: <AuthPage/> },
      { path: paths.signup, element: <AuthPage/> },
    ],
  },
  // Onboarding steps after signup: the user is already signed in by then.
  { path: `${paths.signup}/:step`, element: <Suspense fallback={<AppLoader/>}><AuthPage/></Suspense> },
  {
    element: <RequireAuth/>,
    children: [
      { path: paths.selectBusiness, element: <SelectBusinessPage/> },
      {
        element: <RequireBusiness/>,
        children: [
      { path: paths.createShipment, element: <CreateShipmentPage/> },
      { path: paths.storefront, element: <StorefrontPage/> },
      {
        element: <AppLayout/>,
        children: [
          { index: true, element: <DashboardPage/> },
          { path: paths.items, element: <ItemsPage/> },
          { path: paths.shipments, element: <ShipmentsPage/> },
          { path: paths.tracking, element: <ShipmentsPage tracking/> },
          { path: paths.wallet, element: <WalletPage/> },
          { path: paths.fundWallet, element: <FundWalletPage/> },
          { path: paths.withdraw, element: <WithdrawPage/> },
          { path: paths.walletTransactions, element: <WalletTransactionsPage/> },
          { path: paths.settings, element: <Navigate to={`${paths.settings}/storefront`} replace/> },
          { path: `${paths.settings}/:section`, element: <SettingsPage/> },
        ],
      },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to={paths.dashboard} replace/> },
])
