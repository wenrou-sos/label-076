import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'

const http: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

http.interceptors.response.use(
  (response) => {
    if (response.data && response.data.success !== undefined) {
      if (response.data.success) {
        return response.data.data
      } else {
        return Promise.reject(new Error(response.data.error || '请求失败'))
      }
    }
    return response.data
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const request = <T = any>(config: AxiosRequestConfig): Promise<T> => {
  return http.request<T, T>(config)
}

export default http
