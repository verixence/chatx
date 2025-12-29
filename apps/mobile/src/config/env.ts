/**
 * Environment Configuration
 * Access environment variables with type safety
 */

import Constants from 'expo-constants'

interface EnvConfig {
  API_URL: string
  WEB_URL: string
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  STRIPE_PUBLISHABLE_KEY?: string
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = Constants.expoConfig?.extra?.[key] || process.env[key] || defaultValue

  if (!value) {
    console.warn(`Environment variable ${key} is not set`)
  }

  return value || ''
}

export const ENV: EnvConfig = {
  API_URL: getEnvVar('EXPO_PUBLIC_API_URL', 'http://localhost:3000'),
  WEB_URL: getEnvVar('EXPO_PUBLIC_WEB_URL', 'http://localhost:3000'),
  SUPABASE_URL: getEnvVar('EXPO_PUBLIC_SUPABASE_URL', ''),
  SUPABASE_ANON_KEY: getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY', ''),
  STRIPE_PUBLISHABLE_KEY: getEnvVar('EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY'),
}

export const isDevelopment = __DEV__
export const isProduction = !__DEV__
