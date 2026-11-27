import { useState } from 'react'
import { toast } from 'sonner'
import { apiErrorText, formatActivityDate } from '@/api/http'
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from '@/api/notifications'

export const NOTIFICATION_FILTERS = ['All', 'Unread'] as const
export type NotificationFilter = (typeof NOTIFICATION_FILTERS)[number]

/** sink's Notifications screen: All / Unread, tap a row to mark it read, Mark all read. */
export function useNotificationsPage() {
  const list = useNotifications()
  const markOne = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()
  const [filter, setFilter] = useState<NotificationFilter>('All')
  /** Which row is mid-request, so only that one says "Marking…". */
  const [markingId, setMarkingId] = useState<string | null>(null)

  const rows = (list.data ?? []).map(row => ({ ...row, when: formatActivityDate(row.createdAt) }))
  const unread = rows.filter(row => !row.isRead).length

  return {
    isLoading: list.isLoading,
    isError: list.isError,
    retry: () => { void list.refetch() },
    filter,
    setFilter,
    counts: { All: rows.length, Unread: unread } as Record<NotificationFilter, number>,
    unread,
    rows: filter === 'Unread' ? rows.filter(row => !row.isRead) : rows,
    markingId,
    markRead: (id: string) => {
      setMarkingId(id)
      markOne.mutate(id, {
        onSettled: () => setMarkingId(null),
        onError: error => toast.error(apiErrorText(error, 'Could not mark it as read')),
      })
    },
    markAllRead: () => markAll.mutate(undefined, { onError: error => toast.error(apiErrorText(error, 'Could not mark them as read')) }),
    markingAll: markAll.isPending,
  }
}
