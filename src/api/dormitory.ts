import { request } from './http'
import type { Dormitory } from '../../shared/types'

export interface CreateDormitoryRequest {
  roomNumber: string
  bedNumber: string
  floor: number
  capacity?: number
  notes?: string
}

export interface UpdateDormitoryRequest {
  roomNumber?: string
  bedNumber?: string
  floor?: number
  capacity?: number
  status?: string
  notes?: string
}

export const getDormitories = () => {
  return request<Dormitory[]>({
    url: '/dormitories',
    method: 'GET'
  })
}

export const createDormitory = (data: CreateDormitoryRequest) => {
  return request<Dormitory>({
    url: '/dormitories',
    method: 'POST',
    data
  })
}

export const updateDormitory = (id: string, data: UpdateDormitoryRequest) => {
  return request<Dormitory>({
    url: `/dormitories/${id}`,
    method: 'PUT',
    data
  })
}
