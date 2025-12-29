/**
 * Mobile App Colors
 * Matching ChatX web app design system - warm, inviting educational theme
 */

export const colors = {
  // Primary brand colors - Orange/Peach accent
  primary: '#FB923C',
  primaryDark: '#F97316',
  primaryLight: '#FED7AA',

  // Secondary colors
  secondary: '#1e3a8a',
  secondaryLight: '#2563eb',
  secondaryDark: '#1d4ed8',

  // Background colors - Soft warm peach tones
  background: '#FFFBF5',
  backgroundSecondary: '#FFF5F0',
  backgroundTertiary: '#FFEDD5',
  foreground: '#111827',
  muted: '#F9FAFB',
  mutedForeground: '#6B7280',

  // Surface colors - Clean white cards
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  // Status colors
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  // UI colors
  border: '#F3F4F6',
  input: '#F3F4F6',
  card: '#FFFFFF',
  cardForeground: '#111827',

  // Text colors - Strong contrast
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',

  // Semantic colors
  destructive: '#EF4444',
  destructiveForeground: '#FFFFFF',

  // Transparent overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  backdrop: 'rgba(255, 245, 240, 0.95)',

  // Gradients
  gradientStart: '#FFF5F0',
  gradientEnd: '#FFEDD5',
} as const

export type ColorKey = keyof typeof colors

