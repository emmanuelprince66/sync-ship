import { NIGERIAN_STATES } from '@/api/shipping-settings'
import { SegmentedTabs } from '@/components/ui/common'
import { Field } from '@/components/ui/Field'
import { IDENTITY_SHORT, type KycFlow } from '../../hooks/useKycFlow'
import { OptionSelect } from '../OptionSelect'
import { toOptions } from '../../options'

const IDENTITY_OPTIONS = [{ value: 'nin', label: 'Use NIN' }, { value: 'bvn', label: 'Use BVN' }] as const

/** Fields for the current individual tier. Tier 1 also opens the account (name + date of birth). */
export function IndividualTierForm({ flow }: { flow: KycFlow }) {
  const { form, identityMethod, setIdentityMethod, tier2Identity } = flow.individual
  const { register, formState: { errors } } = form
  const tier = flow.activeTier

  return <div className="space-y-4">
    {tier === 1 && !flow.accountOpened && <div className="grid gap-4 sm:grid-cols-2">
      <Field label="First name" autoComplete="given-name" error={errors.first_name?.message} {...register('first_name')}/>
      <Field label="Last name" autoComplete="family-name" error={errors.last_name?.message} {...register('last_name')}/>
      <Field label="Date of birth" type="date" max={new Date().toISOString().slice(0, 10)} error={errors.dob?.message} {...register('dob')} className="sm:col-span-2"/>
    </div>}

    {tier === 1 && <>
      <div>
        <div className="mb-2 text-[12px] font-extrabold text-[#34483F]">Verify with</div>
        <SegmentedTabs value={identityMethod} onChange={setIdentityMethod} options={IDENTITY_OPTIONS} className="grid grid-cols-2 gap-1 rounded-xl bg-[#EFF4F1] p-1" buttonClassName="rounded-lg py-2.5 text-xs font-extrabold transition"/>
      </div>
      <Field key={identityMethod} label={`${IDENTITY_SHORT[identityMethod]} (11 digits)`} inputMode="numeric" maxLength={11} autoComplete="off" hint={identityMethod === 'bvn' ? 'Dial *565*0# on your registered line to get your BVN' : 'Dial *346# on your registered line to get your NIN'} error={errors[identityMethod]?.message} {...register(identityMethod)}/>
    </>}

    {tier === 2 && <Field label={`${IDENTITY_SHORT[tier2Identity]} (11 digits)`} inputMode="numeric" maxLength={11} autoComplete="off" hint={`Add your ${IDENTITY_SHORT[tier2Identity]} so both identity numbers are on file`} error={errors[tier2Identity]?.message} {...register(tier2Identity)}/>}

    {tier === 3 && <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Residential address" autoComplete="street-address" placeholder="e.g. 18 Admiralty Way, Lekki Phase 1" error={errors.address?.message} {...register('address')} className="sm:col-span-2"/>
      <Field label="City / area" autoComplete="address-level2" error={errors.city?.message} {...register('city')}/>
      <OptionSelect label="State" placeholder="Choose a state" options={toOptions(NIGERIAN_STATES)} error={errors.state?.message} {...register('state')}/>
    </div>}
  </div>
}
