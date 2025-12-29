/**
 * Design Tokens - Colors
 * Shared color palette matching the web app design
 */

export const colors = {
  // Primary brand colors
  primary: '#EFA07F', // Peach/Coral - main brand color
  primaryDark: '#E08A5F',
  primaryLight: '#F9E5DD',
  
  // Secondary colors
  secondary: '#1e3a8a', // Blue - used for headings, links
  secondaryLight: '#2563eb',
  secondaryDark: '#1d4ed8',
  
  // Neutral colors
  background: '#FFFFFF',
  backgroundSecondary: '#F9E5DD',
  foreground: '#000000',
  muted: '#F5F5F5',
  mutedForeground: '#737373',
  
  // Status colors
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  
  // UI colors
  border: '#E5E5E5',
  input: '#E5E5E5',
  card: '#FFFFFF',
  cardForeground: '#000000',
  
  // Text colors
  textPrimary: '#000000',
  textSecondary: '#737373',
  textTertiary: '#A3A3A3',
  
  // Semantic colors
  destructive: '#EF4444',
  destructiveForeground: '#FFFFFF',
} as const

export type ColorKey = keyof typeof colors

