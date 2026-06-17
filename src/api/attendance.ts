import { request } from './http'
import type { Attendance, AbsentAlert, PaginatedResponse, AttendanceBatchRequest } from '../../shared/types'

export interface GetAttendanceParams {
  date?: string
  session?: string
  monkId?: string
  monkType?: string
  page?: number
  pageSize?: number
}

export const getAttendance = (params?: GetAttendanceParams) => {
  return request<PaginatedResponse<Attendance>>({
    url: '/attendance',
    method: 'GET',
    params
  })
}

export const batchCreateAttendance = (data: AttendanceBatchRequest) => {
  return request({
    url: '/attendance/batch',
    method: 'POST',
    data
  })
}

export const getAbsentCount = (monkId: string, monkType: string) => {
  return request<{ count: number; records: Attendance[] }>({
    url: '/attendance/absent-count',
    method: 'GET',
    params: { monkId, monkType }
  })
}

export const getAbsentAlerts = () => {
  return request<AbsentAlert[]>({
    url: '/attendance/absent-alerts',
    method: 'GET'
  })
}
