import { request } from './http'
import type { Notification, PaginatedResponse, GuestRegistration } from '../../shared/types'

export interface GetNotificationsParams {
  page?: number
  pageSize?: number
  isRead?: boolean
  type?: string
}

export const getNotifications = (params?: GetNotificationsParams) => {
  return request<PaginatedResponse<Notification>>({
    url: '/notifications',
    method: 'GET',
    params
  })
}

export const getUnreadCount = () => {
  return request<number>({
    url: '/notifications/unread-count',
    method: 'GET'
  })
}

export const markNotificationRead = (id: string) => {
  return request({
    url: `/notifications/${id}/read`,
    method: 'PUT'
  })
}

export const markAllNotificationsRead = () => {
  return request<number>({
    url: '/notifications/read-all',
    method: 'PUT'
  })
}

export const getExpiringRegistrations = (days?: number) => {
  return request<GuestRegistration[]>({
    url: '/notifications/expiring-registrations',
    method: 'GET',
    params: { days }
  })
}

export const runDailyCheck = () => {
  return request<{ created: number; expired: number; expiring: number }>({
    url: '/notifications/run-daily-check',
    method: 'POST'
  })
}
