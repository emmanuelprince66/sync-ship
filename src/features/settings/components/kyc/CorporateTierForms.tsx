import { NIGERIAN_STATES } from '@/api/shipping-settings'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { BUSINESS_TYPES, CORPORATE_DOCUMENTS, DIRECTOR_DOCUMENTS } from '../../constants'
import type { KycFlow } from '../../hooks/useKycFlow'
import { OptionSelect } from '../OptionSelect'
import { toOptions } from '../../options'
import { DocumentUpload } from './DocumentUpload'

/** Corporate Tier 1: the director opening the account and the registered business. */
export function CorporateTierOneForm({ flow }: { flow: KycFlow }) {
  const { register, formState: { errors } } = flow.corporate.form
  return <div className="space-y-6">
    <fieldset className="space-y-4">
      <legend className="mb-3 text-xs font-extrabold text-[#28483B]">Director details</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" autoComplete="given-name" error={errors.firstname?.message} {...register('firstname')}/>
        <Field label="Last name" autoComplete="family-name" error={errors.lastname?.message} {...register('lastname')}/>
        <Field label="Director’s BVN" inputMode="numeric" maxLength={11} error={errors.bvn?.message} {...register('bvn')}/>
        <Field label="Date of birth" type="date" max={new Date().toISOString().slice(0, 10)} error={errors.dob?.message} {...register('dob')}/>
      </div>
    </fieldset>
    <fieldset className="space-y-4">
      <legend className="mb-3 text-xs font-extrabold text-[#28483B]">Business details</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Registered business name" error={errors.business_name?.message} {...register('business_name')} className="sm:col-span-2"/>
        <OptionSelect label="Business type" placeholder="Choose type" options={BUSINESS_TYPES} error={errors.business_type?.message} {...register('business_type')}/>
        <Field label="RC / BN number" error={errors.registration_number?.message} {...register('registration_number')}/>
        <Field label="Registration date" type="date" max={new Date().toISOString().slice(0, 10)} error={errors.reg_date?.message} {...register('reg_date')}/>
        <OptionSelect label="State" placeholder="Choose a state" options={toOptions(NIGERIAN_STATES)} error={errors.state?.message} {...register('state')}/>
        <Field label="Business address" autoComplete="street-address" error={errors.address?.message} {...register('address')} className="sm:col-span-2"/>
      </div>
    </fieldset>
  </div>
}

/** Corporate Tier 2: TIN, CAC filings and a record per director. */
export function CorporateTierTwoForm({ flow }: { flow: KycFlow }) {
  const { form, documents, documentErrors, setDocument, directors, directorErrors, directorActions, documentsCount } = flow.corporate
  const { register, formState: { errors } } = form

  return <div className="space-y-6">
    <Field label="Tax Identification Number (TIN)" error={errors.tin?.message} {...register('tin')}/>

    <section>
      <div className="mb-3 flex items-center justify-between"><div className="text-xs font-extrabold text-[#28483B]">Company documents</div><span className="text-[10px] font-bold text-[#829189]">{documentsCount} of {CORPORATE_DOCUMENTS.length} added</span></div>
      <div className="space-y-2.5">{CORPORATE_DOCUMENTS.map(doc => <DocumentUpload key={doc.key} label={doc.label} hint={doc.hint} accept={doc.accept} file={documents[doc.key]} error={documentErrors[doc.key]} onChange={file => setDocument(doc.key, file)}/>)}</div>
    </section>

    <section>
      <div className="mb-3 flex items-center justify-between"><div className="text-xs font-extrabold text-[#28483B]">Directors</div><Button variant="ghost" icon="plus" onClick={directorActions.add} className="px-3 py-1.5 text-xs">Add director</Button></div>
      <div className="space-y-4">{directors.map((director, index) => <div key={director.id} className="rounded-2xl border border-[#DDE7E1] bg-[#FAFCFA] p-4">
        <div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2 text-xs font-extrabold text-[#17382C]"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EAF5E9] text-[10px] font-black text-[#438352]">{index + 1}</span>Director {index + 1}</div>
          {directors.length > 1 && <button type="button" onClick={() => directorActions.remove(director.id)} aria-label={`Remove director ${index + 1}`} className="rounded-lg p-2 text-[#A0ADA6] hover:bg-[#FFF0EE] hover:text-[#D15B50]"><Icon name="trash" size={15}/></button>}
        </div>
        <Field label="Full name" value={director.name} onValueChange={name => directorActions.rename(director.id, name)} error={directorErrors[director.id]?.name}/>
        <div className="mt-3 space-y-2.5">{DIRECTOR_DOCUMENTS.map(doc => <DocumentUpload key={doc.key} label={doc.label} hint={doc.hint} accept={doc.accept} file={director.files[doc.key]} error={directorErrors[director.id]?.[doc.key]} onChange={file => directorActions.setFile(director.id, doc.key, file)}/>)}</div>
      </div>)}</div>
    </section>
  </div>
}
