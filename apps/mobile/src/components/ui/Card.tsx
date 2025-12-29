/**
 * Card Component
 * Container for content with elevation and border
 */

import React, { ReactNode } from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'
import { colors } from '../../theme'

interface CardProps {
  children: ReactNode
  style?: ViewStyle
  variant?: 'default' | 'elevated' | 'outlined'
}

export default function Card({ children, style, variant = 'default' }: CardProps) {
  const cardStyles = [
    styles.card,
    variant === 'elevated' && styles.elevated,
    variant === 'outlined' && styles.outlined,
    style,
  ]

  return <View style={cardStyles}>{children}</View>
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.border,
  },
})
