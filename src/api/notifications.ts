import apiClient from './client'
import type { Notification } from '../types'

export async function getNotifications(): Promise<Notification[]> {
  const response = await apiClient.get('/notifications')
  return response.data?.data ?? response.data
}

export async function markNotificationRead(id: string) {
  const response = await apiClient.patch(`/notifications/${id}/read`)
  return response.data?.data ?? response.data
}

export async function markAllNotificationsRead() {
  const response = await apiClient.patch('/notifications/read-all')
  return response.data?.data ?? response.data
}
