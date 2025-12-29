/**
 * Authentication Service
 * Handles login, signup, and auth state
 */

import api from './api'
import { setAuthToken, setUserData, clearAllAuthData, getAuthToken } from '../utils/storage'
import { User, LoginRequest, SignupRequest, AuthResponse } from '../types'

export const authService = {
  /**
   * Sign up a new user
   */
  async signup(data: SignupRequest): Promise<User> {
    try {
      const response = await api.post<AuthResponse>('/api/auth/signup', data)

      if (response.token && response.user) {
        await setAuthToken(response.token)
        await setUserData(response.user)
        return response.user
      }

      throw new Error('Invalid response from signup')
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Signup failed')
    }
  },

  /**
   * Log in an existing user
   */
  async login(data: LoginRequest): Promise<User> {
    try {
      const response = await api.post<AuthResponse>('/api/auth/login', data)

      if (response.token && response.user) {
        await setAuthToken(response.token)
        await setUserData(response.user)
        return response.user
      }

      throw new Error('Invalid credentials')
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed')
    }
  },

  /**
   * Log out the current user
   */
  async logout(): Promise<void> {
    // For JWT auth, just clear local data (no server call needed)
    await clearAllAuthData()
  },

  /**
   * Get current user from API
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const token = await getAuthToken()
      if (!token) return null

      const user = await api.get<User>('/api/user/me')
      await setUserData(user)
      return user
    } catch (error) {
      console.error('Get current user error:', error)
      return null
    }
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await getAuthToken()
    return !!token
  },
}

export default authService
