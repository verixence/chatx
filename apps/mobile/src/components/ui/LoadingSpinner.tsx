/**
 * LoadingSpinner Component
 * Centered loading indicator
 */

import React from 'react'
import { View, ActivityIndicator, Text, StyleSheet, ViewStyle, Image } from 'react-native'
import { colors } from '../../theme'

interface LoadingSpinnerProps {
  text?: string
  size?: 'small' | 'large'
  color?: string
  style?: ViewStyle
  fullScreen?: boolean
}

export default function LoadingSpinner({
  text,
  size = 'large',
  color = colors.primary,
  style,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const containerStyle = [
    styles.container,
    fullScreen && styles.fullScreen,
    style,
  ]

  return (
    <View style={containerStyle}>
      {fullScreen && (
        <Image
          source={require('../../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      )}
      <ActivityIndicator size={size} color={color} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  logo: {
    width: 180,
    height: 80,
    marginBottom: 40,
  },
  text: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
})
