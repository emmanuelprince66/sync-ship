import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Modal, ModalFooter, ModalHeader } from '@/components/ui/Modal'
import { ListSkeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { initials } from '@/lib/format'
import { ROLE_GUIDE, useTeamSection } from './hooks/useTeamSection'
import { InviteEmployeeModal } from './InviteEmployeeModal'
import { SaveBar, SectionHeading } from './shared'

export function TeamSection() {
  const team = useTeamSection()
  const count = (value: number) => (team.isLoading ? '–' : value)

  return <>
    <div className="flex flex-wrap items-start justify-between gap-4"><SectionHeading title="Employee accounts" description="Register team members and control what they can access."/><Button icon="plus" onClick={team.openInvite}>Add employee</Button></div>
    <div className="mt-6 grid grid-cols-3 gap-3">
      <div className="rounded-2xl bg-[#F3F7F4] p-4"><div className="text-xl font-black text-[#17382C]">{count(team.counts.total)}</div><div className="mt-1 text-[10px] text-[#829189]">Total users</div></div>
      <div className="rounded-2xl bg-[#F3F7F4] p-4"><div className="text-xl font-black text-[#17382C]">{count(team.counts.active)}</div><div className="mt-1 text-[10px] text-[#829189]">Active</div></div>
      <div className="rounded-2xl bg-[#FFF7E6] p-4"><div className="text-xl font-black text-[#8D681D]">{count(team.counts.inactive)}</div><div className="mt-1 text-[10px] text-[#927A48]">Inactive</div></div>
    </div>
    <div className="mt-6 overflow-hidden rounded-2xl border border-[#E2E9E5]">
      <div className="hidden grid-cols-[1fr_130px_80px_36px] gap-3 border-b border-[#E7EDE9] bg-[#F8FAF8] px-4 py-3 text-[9px] font-extrabold uppercase tracking-[.08em] text-[#8B9992] sm:grid"><span>Employee</span><span>Role</span><span>Status</span><span/></div>
      {team.isLoading
        ? <ListSkeleton rows={3} rowClassName="flex items-center gap-4 border-b border-[#EDF1EF] px-4 py-4 last:border-0"/>
        : team.isError
          ? <div className="px-4 py-10 text-center text-xs text-[#7D8E85]">We couldn’t load your team. <button type="button" onClick={team.retry} className="font-extrabold text-[#438352]">Try again</button></div>
          : team.employees.length === 0
            ? <div className="px-4 py-10 text-center text-xs text-[#7D8E85]">No employees yet. Add your first team member to share the work.</div>
            : team.employees.map(employee => <div key={employee.id} className="grid grid-cols-[1fr_36px] items-center gap-3 border-b border-[#EDF1EF] px-4 py-4 last:border-0 sm:grid-cols-[1fr_130px_80px_36px]">
              <div className="flex min-w-0 items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF5E9] text-[10px] font-black text-[#438352]">{initials(employee.name)}</div><div className="min-w-0"><div className="truncate text-[11px] font-extrabold text-[#304B40]">{employee.name}</div><div className="mt-0.5 truncate text-[9px] text-[#8A9891]">{employee.phone || employee.email}<span className="sm:hidden"> · {employee.roleLabel}</span></div></div></div>
              <span className="hidden text-[10px] font-bold text-[#60736A] sm:block">{employee.roleLabel}</span>
              <span className={cn('hidden w-fit rounded-full px-2 py-1 text-[8px] font-extrabold sm:block', employee.status === 'Active' ? 'bg-[#E4F2E1] text-[#438352]' : 'bg-[#FFF0D0] text-[#956616]')}>{employee.status}</span>
              {employee.role === 'OWNER'
                ? <span/>
                : <button type="button" aria-label={`Remove ${employee.name}`} onClick={() => team.askRemove(employee)} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#A0ADA6] hover:bg-[#FFF0EE] hover:text-[#D15B50]"><Icon name="trash" size={16}/></button>}
            </div>)}
    </div>
    <div className="mt-5 rounded-2xl bg-[#F4F8F5] p-4 text-[10px] leading-5 text-[#687A71]"><strong className="text-[#315A3E]">Role access:</strong> {ROLE_GUIDE.map(role => `${role.label}: ${role.description}`).join(' ')}</div>
    <SaveBar saving={false} onSave={team.save}/>
    <InviteEmployeeModal open={team.inviting} onClose={team.closeInvite}/>
    <Modal open={Boolean(team.removing)} onClose={team.cancelRemove} panelClassName="w-full max-w-md rounded-3xl bg-white p-7">
      <ModalHeader title="Remove employee?" description={team.removing ? `${team.removing.name} will lose access to this business.` : ''} onClose={team.cancelRemove} align="start"/>
      <ModalFooter><Button variant="ghost" onClick={team.cancelRemove}>Cancel</Button><Button loading={team.removePending} onClick={team.confirmRemove} className="bg-[#D15B50] hover:bg-[#B94A40]">Remove</Button></ModalFooter>
    </Modal>
  </>
}
