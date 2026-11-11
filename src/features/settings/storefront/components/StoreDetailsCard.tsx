import type { StorefrontProfile } from '@/api/storefront-settings'
import { Field } from '@/components/ui/Field'
import { SelectField } from '@/components/ui/SelectField'
import { useStoreDetailsForm } from '../hooks/useStoreDetailsForm'
import { CardActions, SettingsCard } from './SettingsCard'
import { TextAreaField } from '@/components/ui/TextAreaField'

export function StoreDetailsCard({ profile }: { profile: StorefrontProfile }) {
  const form = useStoreDetailsForm(profile)
  const { register, errors } = form

  return <SettingsCard icon="building" title="Store details & contact" description="What customers see on your store, and how they reach you about orders.">
    <form onSubmit={form.onSubmit} noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Store name" error={errors.name?.message} {...register('name')}/>
        <SelectField label="Business sector" options={form.sectors} {...register('sector')}/>
        <div className="md:col-span-2"><Field label="Tagline" placeholder="e.g. Everyday pieces, thoughtfully selected." error={errors.tagline?.message} hint="A short line under your store name (150 characters max)" {...register('tagline')}/></div>
        <div className="md:col-span-2"><TextAreaField label="About your store" placeholder="Tell customers what you sell and what makes you different." error={errors.description?.message} {...register('description')}/></div>
      </div>

      <div className="mb-4 mt-6 text-[10px] font-extrabold uppercase tracking-[.08em] text-[#75877E]">Contact channels</div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Store phone number" type="tel" placeholder="+2348012345678" error={errors.phone?.message} {...register('phone')}/>
        <Field label="WhatsApp number" type="tel" placeholder="+2348012345678" error={errors.whatsapp?.message} hint="Customers use this number for order questions" {...register('whatsapp')}/>
        <div className="md:col-span-2"><Field label="Store email" type="email" placeholder="hello@yourstore.com" error={errors.email?.message} {...register('email')}/></div>
      </div>

      <div className="mb-4 mt-6 text-[10px] font-extrabold uppercase tracking-[.08em] text-[#75877E]">Address & currency</div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2"><Field label="Street address" error={errors.street?.message} {...register('street')}/></div>
        <Field label="City" error={errors.city?.message} {...register('city')}/>
        <Field label="State" error={errors.state?.message} {...register('state')}/>
        <Field label="Country" error={errors.country?.message} {...register('country')}/>
        <div className="grid grid-cols-2 gap-3"><Field label="Zip code" placeholder="Optional" error={errors.zipCode?.message} {...register('zipCode')}/><SelectField label="Currency" options={form.currencies} {...register('currency')}/></div>
      </div>
      <CardActions type="submit" dirty={form.dirty} saving={form.saving} onReset={form.reset} saveLabel="Save details"/>
    </form>
  </SettingsCard>
}
