import { Suspense } from 'react'
import { Outlet } from 'react-router'
import { PageLoader } from '@/components/ui/misc'
import { SetupPrompt } from '@/features/onboarding/SetupPrompt'
import { Header } from './Header'
import { usePageTitle, useSetupPrompt } from './hooks'
import { MobileNav } from './MobileNav'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  const title = usePageTitle()
  const setupPrompt = useSetupPrompt()

  return <div className="min-h-screen bg-[#F7F9F7] text-[#09261C]">
    <Sidebar/>
    <div className="lg:pl-[244px]">
      <Header title={title}/>
      <main className="mx-auto max-w-[1440px] p-4 md:p-7 lg:p-8">
        <Suspense fallback={<PageLoader/>}><Outlet/></Suspense>
      </main>
      {/* Keeps content clear of the fixed mobile nav. */}
      <div className="h-16 lg:hidden" aria-hidden="true"/>
      <MobileNav/>
    </div>
    <SetupPrompt open={setupPrompt.open} onClose={setupPrompt.close} onSelect={setupPrompt.goToSection}/>
  </div>
}
