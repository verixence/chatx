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
  // Try multiple sources for environment variables
  const fromExtra = Constants.expoConfig?.extra?.[key]
  const fromProcessEnv = process.env[key]
  const fromExpoPublic = process.env[`EXPO_PUBLIC_${key.replace('EXPO_PUBLIC_', '')}`]

  const value = fromExtra || fromProcessEnv || fromExpoPublic || defaultValue

  console.log(`[getEnvVar] ${key}:`, {
    fromExtra: !!fromExtra,
    fromProcessEnv: !!fromProcessEnv,
    fromExpoPublic: !!fromExpoPublic,
    finalValue: value?.substring(0, 30) + '...'
  })

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

// Log environment variables on initialization
console.log('[ENV] Environment configuration loaded:')
console.log('[ENV] API_URL:', ENV.API_URL)
console.log('[ENV] WEB_URL:', ENV.WEB_URL)
console.log('[ENV] SUPABASE_URL:', ENV.SUPABASE_URL)
console.log('[ENV] Has SUPABASE_ANON_KEY:', !!ENV.SUPABASE_ANON_KEY)

export const isDevelopment = __DEV__
export const isProduction = !__DEV__
