import { request } from './http'
import type { Resident, PaginatedResponse, PaginationParams } from '../../shared/types'

export interface CreateResidentRequest {
  guestRegistrationId?: string
  dharmaName: string
  generationName: string
  tonsureMaster: string
  preceptsDate: string
  preceptsTemple: string
  position?: string
  probationStartDate: string
}

export interface UpdateResidentRequest {
  dharmaName?: string
  generationName?: string
  tonsureMaster?: string
  preceptsDate?: string
  preceptsTemple?: string
  position?: string
  probationStartDate?: string
  probationEndDate?: string
  ordinationCeremonyDate?: string
  status?: string
}

export interface CompleteProbationRequest {
  ordinationCeremonyDate: string
}

export const getResidents = (params?: PaginationParams) => {
  return request<PaginatedResponse<Resident>>({
    url: '/residents',
    method: 'GET',
    params
  })
}

export const getProbationResidents = () => {
  return request<Resident[]>({
    url: '/residents/probation',
    method: 'GET'
  })
}

export const getResident = (id: string) => {
  return request<Resident>({
    url: `/residents/${id}`,
    method: 'GET'
  })
}

export const createResident = (data: CreateResidentRequest) => {
  return request<Resident>({
    url: '/residents',
    method: 'POST',
    data
  })
}

export const updateResident = (id: string, data: UpdateResidentRequest) => {
  return request<Resident>({
    url: `/residents/${id}`,
    method: 'PUT',
    data
  })
}

export const completeProbation = (id: string, data: CompleteProbationRequest) => {
  return request<Resident>({
    url: `/residents/${id}/complete-probation`,
    method: 'PUT',
    data
  })
}
