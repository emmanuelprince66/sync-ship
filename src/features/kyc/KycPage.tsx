import { Icon } from '@/components/ui/Icon'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { CorporateFlow, IndividualFlow } from './components/Flows'
import { Notice } from './components/KycUi'
import { ACCOUNT_TYPES, useKycPage } from './hooks/useKycPage'

function BackButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="mb-3 inline-flex items-center gap-1.5 text-xs font-extrabold text-[#4A7D57] transition-colors hover:text-[#286B43]">
    <span className="rotate-180"><Icon name="arrow" size={14}/></span>{label}
  </button>
}

/**
 * Identity verification: a full page rather than a modal (sink-inventory's
 * KycConfirm). Corporate Tier 2 alone runs to seven company documents plus two
 * uploads per director, and a page keeps a half-finished verification safe
 * from a stray click outside.
 */
export default function KycPage() {
  const page = useKycPage()

  return <div className="mx-auto w-full max-w-6xl">
    <header className="mb-6">
      {page.canChangeType && <BackButton label="Change account type" onClick={page.backToChooser}/>}
      {page.isUpgrading && <BackButton label="Back to my individual verification" onClick={page.backToChooser}/>}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-black text-[#09261C] sm:text-2xl">{page.headline}</h1>
          <p className="mt-1.5 max-w-2xl text-xs leading-5 text-[#7C8D85] sm:text-sm">{page.subhead}</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-[#E0E8E3] bg-white px-3 py-2 text-[11px] font-bold text-[#60736A]">
          <span className="text-[#438352]"><Icon name="shield" size={13}/></span>Encrypted &amp; verified by licensed providers
        </span>
      </div>
    </header>

    {page.isUpgrading && <Notice tone="info" title="This starts a new corporate verification" className="mb-5">
      You will need your CAC documents, TIN and a record for every director. Nothing here changes the individual account you already verified.
    </Notice>}

    {page.loading
      ? <SkeletonGroup label="Loading verification" className="grid gap-4 md:grid-cols-2"><Skeleton className="h-64 rounded-2xl"/><Skeleton className="h-64 rounded-2xl"/></SkeletonGroup>
      : page.chosen
        ? page.chosen.value === 'individual'
          ? <IndividualFlow kyc={page.kyc} onUpgradeToCorporate={page.upgradeToCorporate}/>
          : <CorporateFlow kyc={page.kyc}/>
        : <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            {ACCOUNT_TYPES.map(type => {
              const active = page.selection === type.value
              return <button key={type.value} type="button" aria-pressed={active} onClick={() => page.setSelection(type.value)} className={cn('rounded-3xl border-2 bg-white p-5 text-left transition', active ? 'border-[#529661] shadow-[0_8px_24px_rgba(19,63,43,.08)]' : 'border-[#E0E8E3] hover:border-[#BDD4C3]')}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', active ? 'bg-[#529661] text-white' : 'bg-[#F0F4F1] text-[#64776D]')}><Icon name={type.icon} size={20}/></span>
                    <div><h2 className="text-sm font-black text-[#17382C]">{type.title}</h2><p className="mt-0.5 text-xs text-[#7C8D85]">{type.blurb}</p></div>
                  </div>
                  <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2', active ? 'border-[#529661] bg-[#529661] text-white' : 'border-[#CAD6CF]')}>{active && <Icon name="check" size={11} stroke={3}/>}</span>
                </div>
                <ul className="mt-4 space-y-2.5 border-t border-[#EDF1EF] pt-4">
                  {type.tiers.map(tier => <li key={tier.tier} className="flex items-start gap-2.5">
                    <span className="mt-0.5 shrink-0 text-[#438352]"><Icon name="shield" size={14}/></span>
                    <span><span className="block text-xs font-extrabold text-[#17382C]">Tier {tier.tier} · {tier.limit} daily</span><span className="block text-[11px] text-[#7C8D85]">{tier.requirement}</span></span>
                  </li>)}
                </ul>
              </button>
            })}
          </div>
          <div className="flex flex-col items-center gap-3">
            <button type="button" onClick={page.confirmSelection} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#09261C] px-6 text-sm font-bold text-white shadow-[0_5px_14px_rgba(9,38,28,.16)] transition-all hover:bg-[#123D2E] sm:w-auto sm:min-w-64">
              Continue <Icon name="arrow" size={16}/>
            </button>
            <p className="text-[11px] text-[#7C8D85]">You can upgrade your tier at any time after verification.</p>
          </div>
        </div>}
  </div>
}
