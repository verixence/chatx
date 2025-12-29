/**
 * Background Image Component
 * Matches the web app's background image styling
 */

import React from 'react'
import { ImageBackground, StyleSheet, ViewStyle, View } from 'react-native'
import { Image } from 'expo-image'

interface BackgroundImageProps {
  children: React.ReactNode
  style?: ViewStyle
}

// Fallback if background image doesn't exist
const backgroundExists = true // Will be true once image is copied

export default function BackgroundImage({ children, style }: BackgroundImageProps) {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#F9E5DD' }, style]}>
      {backgroundExists && (
        <Image
          source={require('../../assets/background.jpeg')}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
      )}
      {children}
    </View>
  )
}

export function BackgroundImageWrapper({ children, style }: BackgroundImageProps) {
  if (backgroundExists) {
    try {
      return (
        <ImageBackground
          source={require('../../assets/background.jpeg')}
          style={[styles.container, style]}
          resizeMode="cover"
        >
          {children}
        </ImageBackground>
      )
    } catch (e) {
      // Fallback if image doesn't exist
    }
  }
  
  // Fallback to solid color if image doesn't exist
  return (
    <View style={[styles.container, { backgroundColor: '#F9E5DD' }, style]}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
})
