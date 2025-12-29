/**
 * Badge Component
 * Small status indicator
 */

import React from 'react'
import { View, Text, StyleSheet, ViewStyle } from 'react-native'
import { colors } from '../../theme'

interface BadgeProps {
  text: string
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info' | 'primary'
  style?: ViewStyle
}

export default function Badge({ text, variant = 'default', style }: BadgeProps) {
  const badgeStyles = [
    styles.badge,
    styles[`badge_${variant}`],
    style,
  ]

  const textStyles = [
    styles.text,
    styles[`text_${variant}`],
  ]

  return (
    <View style={badgeStyles}>
      <Text style={textStyles}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badge_default: {
    backgroundColor: colors.muted,
  },
  badge_primary: {
    backgroundColor: colors.primary,
  },
  badge_success: {
    backgroundColor: colors.success,
  },
  badge_error: {
    backgroundColor: colors.error,
  },
  badge_warning: {
    backgroundColor: colors.warning,
  },
  badge_info: {
    backgroundColor: colors.info,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  text_default: {
    color: colors.textPrimary,
  },
  text_primary: {
    color: colors.textPrimary,
  },
  text_success: {
    color: '#FFFFFF',
  },
  text_error: {
    color: '#FFFFFF',
  },
  text_warning: {
    color: '#000000',
  },
  text_info: {
    color: '#FFFFFF',
  },
})
