import { Suspense } from 'react'
import { Outlet } from 'react-router'
import { PageLoader } from '@/components/ui/misc'
import { SetupPrompt } from '@/features/onboarding/SetupPrompt'
import { usePreloadAppShell } from '@/routes/usePreloadAppShell'
import { Header } from './Header'
import { useSetupPrompt } from './hooks'
import { MobileSidebar, Sidebar } from './Sidebar'

export function AppLayout() {
  const setupPrompt = useSetupPrompt()
  // Users who arrive already signed in skip the login page, so warm the other pages here too.
  usePreloadAppShell()

  return <div className="min-h-screen bg-[#F7F9F7] text-[#09261C]">
    <Sidebar/>
    <MobileSidebar/>
    <div className="lg:pl-[244px]">
      <Header/>
      <main className="mx-auto max-w-[1440px] p-4 md:p-7 lg:p-8">
        <Suspense fallback={<PageLoader/>}><Outlet/></Suspense>
      </main>
    </div>
    <SetupPrompt open={setupPrompt.open} onClose={setupPrompt.close} onSelect={setupPrompt.goToSection}/>
  </div>
}
