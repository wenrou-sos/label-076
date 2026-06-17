import { request } from './http'
import type { LoginRequest, LoginResponse, User } from '../../shared/types'

export const login = (data: LoginRequest) => {
  return request<LoginResponse>({
    url: '/auth/login',
    method: 'POST',
    data
  })
}

export const getCurrentUser = () => {
  return request<User>({
    url: '/auth/me',
    method: 'GET'
  })
}

export const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}
