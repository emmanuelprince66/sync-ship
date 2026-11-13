import { useState } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
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
    openInvite: invite.open,
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
