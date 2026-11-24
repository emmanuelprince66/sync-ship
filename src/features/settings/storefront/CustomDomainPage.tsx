import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { PageHeader } from '@/components/ui/common'
import { customDomainUpgradePath, settingsPath } from '@/routes/paths'

const benefits = [
  ['Professional', 'Customers are more likely to trust a store with your own domain.'],
  ['Easy to remember', 'A simple address helps customers find your store again.'],
  ['Your brand', 'Use your business name instead of a long shared store link.'],
]

export default function CustomDomainPage() {
  const navigate = useNavigate()

  return <div className="mx-auto max-w-5xl space-y-6">
    <PageHeader title="Get your own domain" subtitle="Your business deserves a .com or .ng. Give customers a store address that feels like yours."/>

    <section className="overflow-hidden rounded-3xl bg-[#09261C] p-6 text-white sm:p-8">
      <div className="text-[10px] font-extrabold uppercase tracking-[.12em] text-[#BDE9B8]">A better address for your store</div>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <div className="rounded-2xl bg-white/10 p-4">
          <div className="text-[9px] font-bold uppercase tracking-[.1em] text-white/50">Your current store link</div>
          <div className="mt-2 break-all text-sm font-bold text-white/80">store.sync360.africa/yourbusiness</div>
        </div>
        <span className="flex justify-center text-[#A5D86A]"><Icon name="arrow" size={20}/></span>
        <div className="rounded-2xl bg-white p-4 text-[#17382C]">
          <div className="text-[9px] font-bold uppercase tracking-[.1em] text-[#829189]">Your own domain</div>
          <div className="mt-2 break-all text-sm font-black">yourbusiness.com</div>
          <div className="mt-1 text-[10px] font-semibold text-[#829189]">or yourbusiness.ng</div>
        </div>
      </div>
    </section>

    <section className="rounded-3xl border border-[#E0E8E3] bg-white p-5 sm:p-6">
      <h2 className="text-sm font-extrabold text-[#17382C]">Why upgrade?</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {benefits.map(([title, description]) => <div key={title} className="flex items-start gap-3 rounded-2xl bg-[#F4F8F5] p-4">
          <span className="mt-0.5 shrink-0 text-[#529661]"><Icon name="check" size={16}/></span>
          <div><h3 className="text-xs font-extrabold text-[#28483B]">{title}</h3><p className="mt-1 text-[10px] leading-4 text-[#718279]">{description}</p></div>
        </div>)}
      </div>
    </section>

    <section>
      <div>
        <h2 className="text-sm font-extrabold text-[#17382C]">How to get your domain</h2>
        <p className="mt-1 text-[11px] text-[#829189]">Choose the option that works best for you.</p>
      </div>
      <div className="mt-4 grid items-stretch gap-4 lg:grid-cols-2">
        <article className="group flex flex-col rounded-3xl border border-[#DDE7E1] bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[#B7D2BE] hover:shadow-[0_14px_36px_rgba(9,38,28,.08)] sm:p-6">
          <div className="flex items-start gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EAF5E9] text-[#438352] transition group-hover:bg-[#DFF0DC]"><Icon name="link" size={20}/></span>
            <div className="min-w-0 flex-1">
              <span className="inline-flex rounded-full bg-[#F3F7F4] px-2 py-1 text-[8px] font-extrabold uppercase tracking-[.1em] text-[#718279]">Option 1</span>
              <h3 className="mt-2 text-sm font-extrabold text-[#17382C]">I already have a domain</h3>
              <p className="mt-1 text-[10px] leading-4 text-[#829189]">We’ll guide you through connecting it to your store.</p>
            </div>
          </div>
          <p className="mt-5 flex-1 rounded-2xl bg-[#F7FAF8] p-4 text-[11px] leading-5 text-[#6C7E75]">After upgrading, open Storefront settings, choose <strong className="text-[#405B50]">Connect domain</strong>, and enter your domain. We recommend a subdomain such as <strong className="text-[#405B50]">shop.yourbusiness.com</strong>.</p>
          <Button variant="primary" onClick={() => navigate(settingsPath('Storefront'))} className="mt-4 min-h-11 w-full justify-between"><span>I have a domain</span><Icon name="arrow" size={16}/></Button>
        </article>

        <article className="group flex flex-col rounded-3xl border border-[#DDE7E1] bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[#B7D2BE] hover:shadow-[0_14px_36px_rgba(9,38,28,.08)] sm:p-6">
          <div className="flex items-start gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EAF5E9] text-[#438352] transition group-hover:bg-[#DFF0DC]"><Icon name="building" size={20}/></span>
            <div className="min-w-0 flex-1">
              <span className="inline-flex rounded-full bg-[#F3F7F4] px-2 py-1 text-[8px] font-extrabold uppercase tracking-[.1em] text-[#718279]">Option 2</span>
              <h3 className="mt-2 text-sm font-extrabold text-[#17382C]">I need a domain</h3>
              <p className="mt-1 text-[10px] leading-4 text-[#829189]">Get one yourself or let our team help.</p>
            </div>
          </div>
          <div className="mt-5 flex-1 space-y-2">
            <div className="flex items-start gap-2.5 rounded-2xl bg-[#F7FAF8] p-3.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[9px] font-black text-[#438352]">1</span>
              <p className="text-[10px] leading-4 text-[#6C7E75]"><strong className="text-[#405B50]">Buy it yourself</strong> from any domain provider, then connect it in Storefront settings.</p>
            </div>
            <div className="flex items-start gap-2.5 rounded-2xl bg-[#F7FAF8] p-3.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[9px] font-black text-[#438352]">2</span>
              <p className="text-[10px] leading-4 text-[#6C7E75]"><strong className="text-[#405B50]">Get help</strong> and we’ll help you choose, buy, and set it up.</p>
            </div>
          </div>
          <a href="mailto:support@syncship.africa?subject=Help%20with%20a%20custom%20domain" className="mt-4 inline-flex min-h-11 w-full items-center justify-between rounded-xl bg-[#EAF5E9] px-4 py-2.5 text-sm font-bold text-[#286B43] transition hover:bg-[#DFF0DC]">Contact us to help me <Icon name="arrow" size={16}/></a>
        </article>
      </div>
    </section>

    <section className="rounded-3xl border border-[#DDE7E1] bg-white p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EAF5E9] text-[#438352]"><Icon name="settings" size={17}/></span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-extrabold text-[#28483B]">What happens during setup?</h2>
          <p className="mt-1 text-[11px] leading-5 text-[#6C7E75]">Your domain provider will ask you to add a DNS record so it points to your store:</p>
          <div className="mt-3 grid gap-2 rounded-2xl bg-[#F4F8F5] p-4 sm:grid-cols-3">
            <div><div className="text-[9px] font-extrabold uppercase tracking-[.08em] text-[#829189]">Record type</div><div className="mt-1 text-xs font-bold text-[#28483B]">CNAME</div></div>
            <div><div className="text-[9px] font-extrabold uppercase tracking-[.08em] text-[#829189]">Host example</div><div className="mt-1 text-xs font-bold text-[#28483B]">shop</div></div>
            <div><div className="text-[9px] font-extrabold uppercase tracking-[.08em] text-[#829189]">Points to</div><div className="mt-1 break-all text-xs font-bold text-[#28483B]">store.sync360.africa</div></div>
          </div>
          <p className="mt-3 text-[10px] leading-4 text-[#829189]">The exact host depends on your domain. We’ll show you the values to use when you connect it. DNS updates can take up to 48 hours; your existing store link keeps working in the meantime.</p>
        </div>
      </div>
    </section>

    <section className="flex flex-col items-start justify-between gap-4 rounded-3xl bg-[#09261C] p-5 text-white sm:flex-row sm:items-center sm:p-6">
      <div><h2 className="text-sm font-extrabold">Ready to make your store yours?</h2><p className="mt-1 text-[11px] leading-5 text-white/65">Upgrade to Sync Plus or higher to unlock custom domains.</p></div>
      <Button variant="secondary" onClick={() => navigate(customDomainUpgradePath())} icon="arrow" className="w-full sm:w-auto">Upgrade</Button>
    </section>
  </div>
}
