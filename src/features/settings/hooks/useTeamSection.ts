import { useState } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { usePlanGate } from '@/api/plan'
import { STAFF_ROLES, useEmployees, useRemoveEmployee } from '@/api/settings'
import type { Employee } from '@/api/types'
import { useDisclosure } from '@/hooks/useDisclosure'

export const ROLE_GUIDE = STAFF_ROLES

export const useTeamSection = () => {
  const { data: employees = [], isLoading, isError, refetch } = useEmployees()
  const remove = useRemoveEmployee()
  const invite = useDisclosure()
  const [removing, setRemoving] = useState<Employee | null>(null)
  const active = employees.filter(employee => employee.status === 'Active').length
  const plan = usePlanGate()
  // Attendants are a shared pool with POS / Booking; the owner's own row doesn't count against it.
  const attendants = employees.filter(employee => employee.role !== 'OWNER').length
  const attendantLimit = plan.limit('no_of_attendants')
  const atAttendantLimit = !isLoading && !isError && plan.atLimit('no_of_attendants', attendants)

  const confirmRemove = () => {
    if (!removing) return
    remove.mutate(removing.id, {
      onSuccess: () => { toast.success(`${removing.name} was removed`); setRemoving(null) },
      onError: error => toast.error(errorMessage(error)),
    })
  }

  return {
    employees,
    isLoading,
    isError,
    retry: () => { void refetch() },
    counts: { total: employees.length, active, inactive: employees.length - active },
    inviting: invite.isOpen,
    openInvite: () => { if (!atAttendantLimit) invite.open() },
    /** Plan gate on adding attendants: null when allowed. */
    attendantGate: !atAttendantLimit ? null : plan.branchLocked
      ? { title: 'This branch needs its own plan', link: 'Subscribe this branch', body: 'Only your first business is covered by your account plan. Subscribe this branch to add attendants.' }
      : { title: `You’ve used all ${attendantLimit} attendant ${attendantLimit === 1 ? 'seat' : 'seats'} on ${plan.planName || 'your plan'}`, body: 'Attendants are shared across your Sync360 apps. Upgrade to add more, or remove someone you no longer need.', link: 'Upgrade plan' },
    closeInvite: invite.close,
    removing,
    askRemove: (employee: Employee) => setRemoving(employee),
    cancelRemove: () => setRemoving(null),
    confirmRemove,
    removePending: remove.isPending,
    // Staff changes save as they happen; the design keeps a Save button on every tab.
    save: () => toast.success('Team settings are up to date'),
  }
}
