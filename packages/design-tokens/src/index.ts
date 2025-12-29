/**
 * Design Tokens
 * Shared design system tokens for web and mobile
 */

export * from './colors'
export * from './spacing'
export * from './typography'
export * from './borderRadius'

export const designTokens = {
  colors: require('./colors').colors,
  spacing: require('./spacing').spacing,
  typography: require('./typography').typography,
  borderRadius: require('./borderRadius').borderRadius,
}

