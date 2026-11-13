import { useMemo } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { permissionsFor, type Permissions } from '@/stores/types'

/** What the signed-in user may see and do, from their role and the permissions their login carries. */
export const usePermissions = (): Permissions => {
  const role = useAuthStore(state => state.user?.role)
  const permissions = useAuthStore(state => state.user?.permissions)
  return useMemo(() => permissionsFor({ role, permissions }), [role, permissions])
}
