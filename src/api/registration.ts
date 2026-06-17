import { request } from './http'
import type { GuestRegistration, PaginatedResponse, PaginationParams } from '../../shared/types'

export interface CreateRegistrationRequest {
  dharmaName: string
  originalTemple: string
  preceptsCertificateNo?: string
  arrivalDate: string
  expectedStayDays: number
}

export interface UpdateRegistrationRequest {
  dharmaName?: string
  originalTemple?: string
  preceptsCertificateNo?: string
  arrivalDate?: string
  expectedStayDays?: number
  actualLeaveDate?: string
  status?: string
}

export interface AssignBedRequest {
  roomNumber: string
  bedNumber: string
}

export const getRegistrations = (params?: PaginationParams) => {
  return request<PaginatedResponse<GuestRegistration>>({
    url: '/registrations',
    method: 'GET',
    params
  })
}

export const getRegistration = (id: string) => {
  return request<GuestRegistration>({
    url: `/registrations/${id}`,
    method: 'GET'
  })
}

export const createRegistration = (data: CreateRegistrationRequest) => {
  return request<GuestRegistration>({
    url: '/registrations',
    method: 'POST',
    data
  })
}

export const updateRegistration = (id: string, data: UpdateRegistrationRequest) => {
  return request<GuestRegistration>({
    url: `/registrations/${id}`,
    method: 'PUT',
    data
  })
}

export const deleteRegistration = (id: string) => {
  return request({
    url: `/registrations/${id}`,
    method: 'DELETE'
  })
}

export const assignBed = (id: string, data: AssignBedRequest) => {
  return request<GuestRegistration>({
    url: `/registrations/${id}/assign-bed`,
    method: 'PUT',
    data
  })
}

export const startProbation = (id: string) => {
  return request({
    url: `/registrations/${id}/start-probation`,
    method: 'POST'
  })
}
