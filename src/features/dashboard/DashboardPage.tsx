import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Skeleton, StatCardSkeleton } from '@/components/ui/Skeleton'
import { StatCard } from '@/components/ui/StatCard'
import { OrderDrawer, ShipmentTable } from '@/features/shipments'
import { useDashboard } from './hooks/useDashboard'

export default function DashboardPage() {
  const dashboard = useDashboard()
  return <div className="space-y-6">
    <section className="relative overflow-hidden rounded-[22px] bg-[#09261C] px-7 py-7 text-white md:px-9">
      <div className="pointer-events-none absolute -right-14 -top-24 h-72 w-72 rounded-full border-[50px] border-[#529661]/20"/>
      <div className="pointer-events-none absolute bottom-[-90px] right-[22%] h-52 w-52 rounded-full bg-[#529661]/10"/>
      <div className="relative max-w-xl">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.1em] text-[#C9E9CC]"><span className="h-1.5 w-1.5 rounded-full bg-[#7FCF26]"/>Ready to ship</div>
        <div className="text-2xl font-black leading-tight tracking-[-.6px] md:text-[30px]">Move your products, without the logistics headache.</div>
        <p className="mt-3 max-w-lg text-sm leading-6 text-white/65">Compare trusted delivery partners, book a rider, and track every order from one simple dashboard.</p>
        {dashboard.canCreateShipments && <Button onClick={dashboard.createShipment} variant="secondary" icon="plus" className="mt-6">Create a shipment</Button>}
      </div>
    </section>

    <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {dashboard.statsLoading
        ? Array.from({ length: 4 }, (_, index) => <StatCardSkeleton key={index}/>)
        : dashboard.statCards.map(card => <StatCard key={card.label} {...card}/>)}
    </section>

    <section className={dashboard.showWallet ? 'grid gap-5 xl:grid-cols-[1fr_330px]' : 'grid gap-5'}>
      <div className="overflow-hidden rounded-2xl border border-[#E2EAE5] bg-white">
        <div className="flex items-center justify-between border-b border-[#EBF0ED] px-5 py-4"><div><div className="text-sm font-extrabold text-[#17382C]">Recent shipments</div><div className="mt-0.5 text-[10px] text-[#899890]">Your latest delivery activity</div></div>{dashboard.canViewShipments && <button type="button" onClick={dashboard.viewShipments} className="flex items-center gap-1 text-xs font-extrabold text-[#438352]">View all <Icon name="arrow" size={15}/></button>}</div>
        <ShipmentTable shipments={dashboard.shipments} compact loading={dashboard.shipmentsLoading} onView={dashboard.drawer.open}/>
      </div>
      <div className="space-y-5">
        {dashboard.showWallet && <div className="rounded-2xl border border-[#E2EAE5] bg-white p-5">
          <div className="flex items-center justify-between"><div className="text-sm font-extrabold text-[#17382C]">Wallet balance</div><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF5E9] text-[#438352]"><Icon name="wallet" size={17}/></div></div>
          {dashboard.walletLoading
            ? <div className="mt-5 flex h-[42px] items-center" role="status" aria-label="Loading balance"><Skeleton className="h-8 w-40"/></div>
            : <div className="mt-5 text-[28px] font-black tracking-[-1px] text-[#09261C]">{dashboard.walletBalance}<span className="text-sm text-[#91A098]">{dashboard.walletKobo}</span></div>}
          <div className="mt-1 text-[10px] text-[#829189]">Available for withdrawal</div>
          <div className={dashboard.canTransfer ? 'mt-5 grid grid-cols-2 gap-2' : 'mt-5 grid gap-2'}>{dashboard.canTransfer && <Button variant="primary" disabled={dashboard.walletLoading} onClick={dashboard.withdraw} className="py-2 text-xs">Withdraw</Button>}<Button variant="outline" onClick={dashboard.fundWallet} className="py-2 text-xs">Fund wallet</Button></div>
        </div>}
        {dashboard.showSetup && !dashboard.setup.loading && !dashboard.setup.done && <div className="rounded-2xl border border-[#CFE4CD] bg-[#EEF8EC] p-5">
          <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#438352]"><Icon name="building" size={18}/></div><div><div className="text-xs font-extrabold text-[#214A31]">Complete business setup</div><div className="text-[10px] text-[#68806D]">{dashboard.setup.completed} of {dashboard.setup.total} steps completed</div></div></div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-[#529661]" style={{ width: `${dashboard.setup.percent}%` }}/></div>
          <button type="button" onClick={dashboard.continueSetup} className="mt-4 flex items-center gap-1 text-[11px] font-extrabold text-[#397A48]">{dashboard.setup.nextLabel} <Icon name="arrow" size={14}/></button>
        </div>}
      </div>
    </section>
    <OrderDrawer shipment={dashboard.drawer.selected} onClose={dashboard.drawer.close} onDownloadReceipt={dashboard.drawer.downloadReceipt} onTrack={dashboard.drawer.trackLive}/>
  </div>
}
