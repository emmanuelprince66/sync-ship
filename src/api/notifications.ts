import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api-client'
import { useCurrentBusinessId } from './business'
import { asRecord, isLive, num, str } from './http'

/**
 * Notifications, same endpoints as sink-inventory (api/noti, app/(dashboard)/notification):
 *  GET   notification/{business_id}/              → { unread_count, notifications: [...] } (recent ones)
 *  GET   notification/unread-count/{business_id}/ → { unread_notifications_count } (the bell's badge)
 *  PATCH notification/mark-read/{notification_id}/ (sink: PATCH, as the swagger says)
 *  POST  notification/mark-all-read/{business_id}/
 */

const KEY = ['notifications'] as const

export type AppNotification = { id: string; message: string; type: string; isRead: boolean; createdAt: string }

const getUnreadCount = async (businessId: string) => {
  const payload = asRecord(await apiRequest<unknown>(`notification/unread-count/${businessId}/`))
  const data = asRecord(payload.data ?? payload)
  return num(data.unread_notifications_count ?? data.unread_count)
}

export const useUnreadNotifications = () => {
  const { businessId } = useCurrentBusinessId()
  return useQuery({
    queryKey: [...KEY, 'unread', businessId],
    queryFn: () => getUnreadCount(businessId as string),
    enabled: isLive() && Boolean(businessId),
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}

const mapNotification = (value: unknown): AppNotification => {
  const row = asRecord(value)
  return { id: str(row.id), message: str(row.message) || str(row.title), type: str(row.type).toUpperCase(), isRead: row.is_read === true, createdAt: str(row.created_at) }
}

/** The feed is an envelope ({ notifications: [...] }), sometimes nested under data; a bare list is accepted too. */
const getNotifications = async (businessId: string): Promise<AppNotification[]> => {
  const payload = asRecord(await apiRequest<unknown>(`notification/${businessId}/`))
  const data = payload.data ?? payload
  const rows = Array.isArray(data) ? data : Array.isArray(asRecord(data).notifications) ? asRecord(data).notifications as unknown[] : []
  // sink keeps a de-duplication guard: the feed once repeated rows under one id.
  const seen = new Set<string>()
  return rows.map(mapNotification).filter(row => {
    if (!row.id) return true
    if (seen.has(row.id)) return false
    seen.add(row.id)
    return true
  })
}

export const useNotifications = () => {
  const { businessId } = useCurrentBusinessId()
  return useQuery({
    queryKey: [...KEY, 'list', businessId],
    queryFn: () => getNotifications(businessId as string),
    enabled: isLive() && Boolean(businessId),
    staleTime: 30_000,
  })
}

/** After a read, the page and the bell's badge both refresh. */
const useRefresh = () => {
  const client = useQueryClient()
  return () => client.invalidateQueries({ queryKey: KEY })
}

export const useMarkNotificationRead = () => {
  const onSuccess = useRefresh()
  return useMutation({ mutationFn: (id: string) => apiRequest<unknown>(`notification/mark-read/${id}/`, { method: 'PATCH' }), onSuccess })
}

export const useMarkAllNotificationsRead = () => {
  const { businessId } = useCurrentBusinessId()
  const onSuccess = useRefresh()
  return useMutation({ mutationFn: () => apiRequest<unknown>(`notification/mark-all-read/${businessId}/`, { method: 'POST' }), onSuccess })
}
