import { Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { AppLoader } from '@/components/ui/AppLoader'
import { PageLoader } from '@/components/ui/misc'
import { GuestOnly, RequireAuth, RequireBusiness, RequirePage, RequirePermission } from './guards'
import { pages } from './pages'
import { paths } from './paths'

const { AuthPage, SelectBusinessPage, DashboardPage, ShipmentsPage, CreateShipmentPage, ItemsPage, StorefrontPage, WalletPage, SettingsPage, KycPage, CustomersPage, CustomerDetailPage } = pages

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
        children: [{
          element: <RequirePage/>,
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
          { path: paths.customers, element: <CustomersPage/> },
          { path: `${paths.customers}/:customerId`, element: <CustomerDetailPage/> },
          { path: paths.wallet, element: <WalletPage/> },
          // Old wallet sub-pages now open modals on the wallet page (sink keeps it all on one screen).
          { path: paths.fundWallet, element: <Navigate to={`${paths.wallet}?action=fund`} replace/> },
          { path: paths.withdraw, element: <Navigate to={`${paths.wallet}?action=transfer`} replace/> },
          { path: paths.walletTransactions, element: <Navigate to={paths.wallet} replace/> },
          // Show the loader during the redirect; a bare <Navigate/> rendered an empty page (white flash).
          {
            // Setup is for super admins; attendants are sent back to Overview.
            element: <RequirePermission permission="canManageSetup"/>,
            children: [
              { path: paths.settings, element: <><PageLoader/><Navigate to={`${paths.settings}/storefront`} replace/></> },
              { path: `${paths.settings}/:section`, element: <SettingsPage/> },
              { path: paths.kyc, element: <KycPage/> },
            ],
          },
        ],
      },
          ],
        }],
      },
    ],
  },
  { path: '*', element: <Navigate to={paths.dashboard} replace/> },
])
