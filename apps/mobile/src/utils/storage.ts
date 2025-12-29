/**
 * AsyncStorage Utilities
 * Secure storage for auth tokens and user data
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import { User } from '../types'

const STORAGE_KEYS = {
  AUTH_TOKEN: '@chatx_auth_token',
  USER_DATA: '@chatx_user_data',
  LAST_SYNC: '@chatx_last_sync',
} as const

// Auth Token
export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
  } catch (error) {
    console.error('Error getting auth token:', error)
    return null
  }
}

export const setAuthToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token)
  } catch (error) {
    console.error('Error setting auth token:', error)
  }
}

export const clearAuthToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
  } catch (error) {
    console.error('Error clearing auth token:', error)
  }
}

// User Data
export const getUserData = async (): Promise<User | null> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Error getting user data:', error)
    return null
  }
}

export const setUserData = async (user: User): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user))
  } catch (error) {
    console.error('Error setting user data:', error)
  }
}

export const clearUserData = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA)
  } catch (error) {
    console.error('Error clearing user data:', error)
  }
}

// Clear all auth data
export const clearAllAuthData = async (): Promise<void> => {
  try {
    await Promise.all([clearAuthToken(), clearUserData()])
  } catch (error) {
    console.error('Error clearing all auth data:', error)
  }
}

// Last Sync
export const getLastSyncTime = async (): Promise<number | null> => {
  try {
    const time = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC)
    return time ? parseInt(time, 10) : null
  } catch (error) {
    console.error('Error getting last sync time:', error)
    return null
  }
}

export const setLastSyncTime = async (time: number): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, time.toString())
  } catch (error) {
    console.error('Error setting last sync time:', error)
  }
}
