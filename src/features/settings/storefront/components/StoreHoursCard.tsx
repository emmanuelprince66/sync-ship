import type { StorefrontProfile, WeekDay } from '@/api/storefront-settings'
import { SegmentedTabs } from '@/components/ui/common'
import { cn } from '@/lib/cn'
import { presetOptions, useStoreHours } from '../hooks/useStoreHours'
import { CardActions, SettingsCard } from './SettingsCard'

function DayChips({ label, days, selected, onToggle }: { label: string; days: readonly { value: WeekDay; short: string }[]; selected: WeekDay[]; onToggle: (day: WeekDay) => void }) {
  return <div role="group" aria-label={label} className="grid grid-cols-7 gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
    {days.map(day => {
      const on = selected.includes(day.value)
      return <button key={day.value} type="button" aria-pressed={on} onClick={() => onToggle(day.value)} className={cn('rounded-xl py-2.5 text-[11px] font-extrabold transition sm:min-w-[52px] sm:px-3', on ? 'bg-[#529661] text-white shadow-[0_4px_12px_rgba(82,150,97,.25)]' : 'border border-[#DCE7E0] bg-white text-[#7C8D85] hover:border-[#529661]')}>{day.short}</button>
    })}
  </div>
}

export function StoreHoursCard({ profile }: { profile: StorefrontProfile }) {
  const hours = useStoreHours(profile)

  return <SettingsCard icon="clock" title="Opening & delivery days" description="Shown on your storefront so customers know when you’re open and when orders go out.">
    <div className="space-y-6">
      <div>
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-[12px] font-extrabold text-[#34483F]">Opening days</span>
          <SegmentedTabs value={hours.preset} onChange={hours.setPreset} options={presetOptions} className="grid grid-cols-3 gap-1 rounded-xl bg-[#EAF1EC] p-1 sm:w-fit" buttonClassName="rounded-lg px-3 py-1.5 text-[11px] font-extrabold transition"/>
        </div>
        <DayChips label="Opening days" days={hours.days} selected={hours.workingDays} onToggle={hours.toggleWorkingDay}/>
      </div>
      <div>
        <div className="mb-1 text-[12px] font-extrabold text-[#34483F]">Delivery days</div>
        <p className="mb-3 text-[10px] text-[#87968F]">Days riders pick up and deliver your orders.</p>
        <DayChips label="Delivery days" days={hours.days} selected={hours.deliveryDays} onToggle={hours.toggleDeliveryDay}/>
      </div>
    </div>
    <CardActions dirty={hours.dirty} saving={hours.saving} onReset={hours.reset} onSave={hours.submit} saveLabel="Save days"/>
  </SettingsCard>
}
