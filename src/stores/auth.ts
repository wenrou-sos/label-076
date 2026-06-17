import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as apiLogin, getCurrentUser, logout as apiLogout } from '@/api/auth'
import type { User, LoginRequest } from '../../shared/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))

  const isLoggedIn = computed(() => !!token.value)

  const initAuth = async () => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (savedToken && savedUser) {
      token.value = savedToken
      user.value = JSON.parse(savedUser)
    }
  }

  const login = async (data: LoginRequest) => {
    const response = await apiLogin(data)
    token.value = response.token
    user.value = response.user
    localStorage.setItem('token', response.token)
    localStorage.setItem('user', JSON.stringify(response.user))
    return response
  }

  const fetchCurrentUser = async () => {
    try {
      const currentUser = await getCurrentUser()
      user.value = currentUser
      localStorage.setItem('user', JSON.stringify(currentUser))
    } catch (error) {
      console.error('Failed to fetch current user:', error)
    }
  }

  const logout = () => {
    apiLogout()
    token.value = null
    user.value = null
  }

  const hasRole = (roles: string[]) => {
    if (!user.value) return false
    return roles.includes(user.value.role)
  }

  return {
    user,
    token,
    isLoggedIn,
    initAuth,
    login,
    fetchCurrentUser,
    logout,
    hasRole
  }
})
