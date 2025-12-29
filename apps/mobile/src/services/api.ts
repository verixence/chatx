/**
 * API Client
 * Centralized HTTP client for backend API calls
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios'
import { ENV } from '../config/env'
import { getAuthToken, clearAuthToken } from '../utils/storage'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    console.log('[API Client] Initializing with baseURL:', ENV.API_URL)
    this.client = axios.create({
      baseURL: ENV.API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        console.log('[API Client] Making request:', config.method?.toUpperCase(), config.url)
        console.log('[API Client] Request data:', config.data)
        const token = await getAuthToken()
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        console.error('[API Client] Request interceptor error:', error)
        return Promise.reject(error)
      }
    )

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log('[API Client] Response received:', response.status, response.statusText)
        return response
      },
      async (error: AxiosError) => {
        console.error('[API Client] Response error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
        })
        if (error.response?.status === 401) {
          // Token expired or invalid
          await clearAuthToken()
          // You might want to redirect to login here
        }
        return Promise.reject(error)
      }
    )
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config)
    return response.data
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config)
    return response.data
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config)
    return response.data
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config)
    return response.data
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config)
    return response.data
  }

  // Upload file with multipart/form-data
  async uploadFile<T>(url: string, formData: FormData, onProgress?: (progress: number) => void): Promise<T> {
    const response = await this.client.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      },
    })
    return response.data
  }
}

export const api = new ApiClient()
export default api
