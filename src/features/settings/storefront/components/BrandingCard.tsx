import type { StorefrontProfile, StoreTheme } from '@/api/storefront-settings'
import { FilePicker } from '@/components/ui/common'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'
import { initials } from '@/lib/format'
import { useBranding } from '../hooks/useBranding'
import { CardActions, SettingsCard } from './SettingsCard'
import { StorePreview } from './StorePreview'

export function BrandingCard({ profile, themes }: { profile: StorefrontProfile; themes: StoreTheme[] }) {
  const branding = useBranding(profile, themes)

  return <SettingsCard icon="grid" title="Branding" description="Your logo, banners and brand colour across the storefront and checkout.">
    <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
      <div className="min-w-0 space-y-6">
        <div>
          <div className="mb-2 text-[12px] font-extrabold text-[#34483F]">Logo</div>
          <FilePicker accept="image/*" onFile={branding.pickLogo} className="flex items-center gap-4 rounded-2xl border border-dashed border-[#C9D8CF] bg-[#FAFCFA] p-4 transition hover:border-[#529661]">
            {branding.logo
              ? <img src={branding.logo} alt="Store logo" className="h-14 w-14 shrink-0 rounded-xl object-cover"/>
              : <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#EAF5E9] text-sm font-black text-[#438352]">{initials(profile.name || 'Store')}</div>}
            <div><div className="text-xs font-extrabold text-[#28483B]">{branding.logo ? 'Change logo' : 'Upload your logo'}</div><div className="mt-1 text-[10px] text-[#87968F]">Square PNG or JPG · up to 5 MB</div></div>
          </FilePicker>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between"><span className="text-[12px] font-extrabold text-[#34483F]">Homepage banners</span><span className="text-[10px] font-bold text-[#87968F]">{branding.banners.length}/{branding.maxBanners}</span></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {branding.banners.map((banner, index) => <div key={banner.id} className="group relative aspect-[16/9] overflow-hidden rounded-xl border border-[#E0E8E3] bg-[#F3F7F4]">
              <img src={banner.url} alt={`Banner ${index + 1}`} className="h-full w-full object-cover"/>
              {banner.file && <span className="absolute left-2 top-2 rounded-full bg-white px-2 py-0.5 text-[8px] font-extrabold text-[#438352] shadow-sm">New</span>}
              <button type="button" onClick={() => branding.removeBanner(banner.id)} aria-label={`Remove banner ${index + 1}`} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-[#D15B50] shadow-sm transition hover:bg-white"><Icon name="trash" size={14}/></button>
            </div>)}
            {branding.canAddBanner && <FilePicker accept="image/*" onFile={branding.addBanner} className="flex aspect-[16/9] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[#C9D8CF] bg-[#FAFCFA] text-[#708179] transition hover:border-[#529661]">
              <Icon name="plus" size={18}/><span className="text-[10px] font-bold">Add banner</span>
            </FilePicker>}
          </div>
          <p className="mt-2 text-[10px] text-[#87968F]">Wide images (1200 × 600) look best. They rotate at the top of your store.</p>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between"><span className="text-[12px] font-extrabold text-[#34483F]">Brand colour</span><span className="text-[10px] font-bold text-[#87968F]">{branding.activeTheme?.label ?? branding.theme}</span></div>
          <div role="radiogroup" aria-label="Brand colour" className="grid grid-cols-6 gap-2.5 sm:grid-cols-11">
            {themes.map(theme => {
              const selected = theme.primary.toLowerCase() === branding.theme.toLowerCase()
              return <button key={theme.key} type="button" role="radio" aria-checked={selected} aria-label={theme.label} title={theme.label} onClick={() => branding.selectTheme(theme)} className={cn('relative flex aspect-square items-center justify-center rounded-full transition', selected ? 'ring-2 ring-[#09261C] ring-offset-2' : 'hover:scale-105')} style={{ backgroundColor: theme.primary, color: theme.on_primary }}>
                {selected && <Icon name="check" size={14} stroke={3}/>}
              </button>
            })}
          </div>
        </div>
      </div>
      <StorePreview name={profile.name} tagline={profile.tagline} logo={branding.logo} banner={branding.banners[0]?.url} theme={branding.activeTheme}/>
    </div>
    <CardActions dirty={branding.dirty} saving={branding.saving} onReset={branding.reset} onSave={branding.submit} saveLabel="Save branding"/>
  </SettingsCard>
}
