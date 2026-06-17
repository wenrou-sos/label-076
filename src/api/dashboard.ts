import { request } from './http'
import type { DashboardStats } from '../../shared/types'

export const getDashboardStats = () => {
  return request<DashboardStats>({
    url: '/dashboard/stats',
    method: 'GET'
  })
}
