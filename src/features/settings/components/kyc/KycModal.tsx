import { Button } from '@/components/ui/Button'
import { SuccessIcon } from '@/components/ui/common'
import { Icon } from '@/components/ui/Icon'
import { Modal, ModalFooter, ModalHeader } from '@/components/ui/Modal'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import { useKycFlow } from '../../hooks/useKycFlow'
import { AccountTypePicker } from './AccountTypePicker'
import { CorporateTierOneForm, CorporateTierTwoForm } from './CorporateTierForms'
import { IndividualTierForm } from './IndividualTierForm'
import { TierRail } from './TierRail'

function KycSkeleton() {
  return <SkeletonGroup label="Loading verification" className="mt-6 space-y-4">
    <div className="grid gap-2 sm:grid-cols-3">{[0, 1, 2].map(index => <Skeleton key={index} className="h-[92px] rounded-2xl"/>)}</div>
    <Skeleton className="h-12 rounded-xl"/>
    <Skeleton className="h-12 rounded-xl"/>
  </SkeletonGroup>
}

/** Multi-step KYC: pick a path, then submit one tier at a time. */
export function KycModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const flow = useKycFlow()
  const { accountType, isLoading, isComplete, corporateReview, activeTier } = flow
  const submit = accountType === 'corporate' ? flow.corporate.submit : flow.individual.submit
  const showForm = Boolean(accountType) && !isComplete && !corporateReview.underReview

  return <Modal open={open} onClose={onClose} panelClassName="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-[0_25px_80px_rgba(9,38,28,.2)]">
    <div className="border-b border-[#EDF1EF] p-5 sm:p-7 sm:pb-5">
      <ModalHeader title="Verify your business" description="Unlock withdrawals and higher daily limits. Each tier takes a minute." onClose={onClose}/>
    </div>

    <div className="flex-1 overflow-y-auto p-5 sm:p-7">
      {isLoading ? <KycSkeleton/> : !accountType ? <>
        <div className="mb-4 text-sm font-black text-[#0F3124]">How is your business set up?</div>
        <AccountTypePicker value={accountType} onChange={flow.chooseAccountType}/>
      </> : <>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="text-sm font-black text-[#0F3124]">{accountType === 'corporate' ? 'Registered business' : 'Individual'} verification</div>
          {flow.canChangeType && !flow.accountOpened && <button type="button" onClick={() => flow.chooseAccountType(accountType === 'corporate' ? 'individual' : 'corporate')} className="text-[10px] font-extrabold text-[#4A8C58]">Switch to {accountType === 'corporate' ? 'individual' : 'registered business'}</button>}
        </div>
        <TierRail tiers={flow.tiers}/>

        {isComplete && <div className="py-8 text-center"><SuccessIcon/><div className="mt-5 text-lg font-black text-[#17382C]">You’re fully verified</div><div className="mx-auto mt-1 max-w-sm text-xs leading-5 text-[#798A81]">Your account is on the highest tier. Withdrawals and online payments are unlocked.</div></div>}

        {!isComplete && corporateReview.underReview && <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[#FFF8E8] p-4">
          <span className="mt-0.5 text-[#A16A15]"><Icon name="clock" size={18}/></span>
          <div><div className="text-xs font-extrabold text-[#80662B]">Documents under review</div><div className="mt-1 text-[11px] leading-5 text-[#8D7445]">We’ve received your company documents{corporateReview.submittedLabel ? ` (${corporateReview.submittedLabel})` : ''}. Reviews usually finish within 2 working days — we’ll notify you.</div></div>
        </div>}

        {corporateReview.state === 'REJECTED' && <div className="mt-6 rounded-2xl bg-[#FFF0EE] p-4 text-[11px] leading-5 text-[#A0463D]"><strong>Documents were sent back.</strong> Check each file is clear and current, then submit again.</div>}

        {showForm && <div className="mt-6">
          <div className="mb-4"><div className="text-xs font-extrabold text-[#28483B]">Tier {activeTier}: {flow.activeTierInfo?.title}</div><div className="mt-0.5 text-[10px] text-[#829189]">{flow.activeTierInfo?.requirement}</div></div>
          {accountType === 'individual' && <IndividualTierForm flow={flow}/>}
          {accountType === 'corporate' && activeTier === 1 && <CorporateTierOneForm flow={flow}/>}
          {accountType === 'corporate' && activeTier === 2 && <CorporateTierTwoForm flow={flow}/>}
          <div className="mt-5 flex items-start gap-2 rounded-xl border border-[#DDE8E0] bg-[#F8FAF8] p-3.5 text-[10px] leading-4 text-[#708179]"><Icon name="shield" size={15}/><span>Your details go straight to our licensed banking partner (VFD Microfinance Bank) for verification. SyncShip never stores your BVN or NIN.</span></div>
        </div>}
      </>}
    </div>

    <div className="border-t border-[#EDF1EF] px-5 py-4 sm:px-7">
      <ModalFooter className="mt-0">
        <Button variant="ghost" onClick={onClose}>{showForm ? 'Cancel' : 'Close'}</Button>
        {showForm && <Button icon="shield" loading={flow.submitting} onClick={submit}>Submit tier {activeTier}</Button>}
      </ModalFooter>
    </div>
  </Modal>
}
