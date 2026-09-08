import { api } from './axiosClient'
import type { ApiResponse, Notification } from '../types'

interface NotificationListData {
  notifications: Notification[]
  unreadCount: number
}

export async function getNotifications(params?: { department?: string; unreadOnly?: boolean; limit?: number }) {
  const response = await api.get<ApiResponse<NotificationListData>>('/notifications', {
    params: {
      ...params,
      unreadOnly: params?.unreadOnly ? 'true' : undefined,
    },
  })
  return response.data.data
}

export async function markNotificationRead(id: string) {
  const response = await api.patch<ApiResponse<Notification>>(`/notifications/${id}/read`)
  return response.data.data
}

export async function markAllNotificationsRead(department?: string) {
  const response = await api.patch<ApiResponse<{ modifiedCount: number }>>('/notifications/read-all', {
    department,
  })
  return response.data.data
}
