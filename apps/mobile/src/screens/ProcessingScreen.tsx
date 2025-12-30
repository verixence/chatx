/**
 * ProcessingScreen - Creative loading screen while content is being processed
 * Shows progress and auto-navigates to ContentDetailScreen when complete
 */

import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import contentService from '../services/content'
import { RootStackParamList } from '../navigation/types'

type ProcessingRouteProp = RouteProp<RootStackParamList, 'Processing'>
type NavigationProp = NativeStackNavigationProp<RootStackParamList>

const { width } = Dimensions.get('window')

export default function ProcessingScreen() {
  const route = useRoute<ProcessingRouteProp>()
  const navigation = useNavigation<NavigationProp>()
  const { contentId, contentType } = route.params

  const [progress] = useState(new Animated.Value(0))
  const [pulseAnim] = useState(new Animated.Value(1))
  const [rotateAnim] = useState(new Animated.Value(0))
  const [status, setStatus] = useState('Uploading...')
  const [dots, setDots] = useState('')

  useEffect(() => {
    // Animated progress bar
    Animated.timing(progress, {
      toValue: 1,
      duration: 30000, // 30 seconds estimated
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
      useNativeDriver: false,
    }).start()

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start()

    // Rotate animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start()

    // Animated dots
    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'))
    }, 500)

    return () => clearInterval(dotsInterval)
  }, [])

  useEffect(() => {
    // Poll for content status
    const checkStatus = async () => {
      try {
        const content = await contentService.getContent(contentId)
        console.log(`[ProcessingScreen] Content status: ${content.status}`)

        // Content is ready to view - can be 'complete' or 'ready'
        if (content.status === 'complete' || content.status === 'ready') {
          setStatus('✨ Processing complete!')
          // Wait a moment before navigating
          setTimeout(() => {
            navigation.replace('ContentDetail', {
              contentId,
              workspaceId: content.workspaceId,
            })
          }, 1000)
        } else if (content.status === 'processing') {
          setStatus('Processing your content')
        } else if (content.status === 'failed') {
          setStatus('Processing failed')
          setTimeout(() => {
            navigation.goBack()
          }, 2000)
        } else {
          // Unknown status, treat as processing
          console.warn(`[ProcessingScreen] Unknown status: ${content.status}`)
          setStatus('Processing your content')
        }
      } catch (error) {
        console.error('[ProcessingScreen] Error checking status:', error)
      }
    }

    // Initial check after 2 seconds
    const initialTimeout = setTimeout(checkStatus, 2000)

    // Then poll every 3 seconds
    const pollInterval = setInterval(checkStatus, 3000)

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(pollInterval)
    }
  }, [contentId, navigation])

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  })

  const getIcon = () => {
    switch (contentType) {
      case 'pdf':
        return 'document-text'
      case 'youtube':
        return 'logo-youtube'
      case 'text':
        return 'text'
      default:
        return 'cloud-upload'
    }
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFF5F0', '#FFE5D1', '#FFDCC1']}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.content}>
        {/* Main Icon */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#FB923C', '#F97316']}
            style={styles.iconGradient}
          >
            <Ionicons name={getIcon()} size={60} color="white" />
          </LinearGradient>
        </Animated.View>

        {/* Processing Icon */}
        <Animated.View
          style={[
            styles.processingIcon,
            {
              transform: [{ rotate: spin }],
            },
          ]}
        >
          <Ionicons name="sync" size={40} color="#FB923C" />
        </Animated.View>

        {/* Status Text */}
        <Text style={styles.title}>
          {status}
          {status.includes('Processing') && dots}
        </Text>

        <Text style={styles.subtitle}>
          This usually takes 10-30 seconds
        </Text>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressWidth,
                },
              ]}
            >
              <LinearGradient
                colors={['#FB923C', '#F97316']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />
            </Animated.View>
          </View>
        </View>

        {/* Processing Steps */}
        <View style={styles.stepsContainer}>
          <ProcessingStep
            icon="cloud-upload"
            text="Uploading content"
            completed={true}
          />
          <ProcessingStep
            icon="analytics"
            text="Analyzing content"
            active={status.includes('Processing')}
          />
          <ProcessingStep
            icon="bulb"
            text="Generating insights"
            active={false}
          />
          <ProcessingStep
            icon="checkmark-circle"
            text="Creating study materials"
            active={false}
          />
        </View>
      </SafeAreaView>
    </View>
  )
}

function ProcessingStep({
  icon,
  text,
  completed = false,
  active = false,
}: {
  icon: keyof typeof Ionicons.glyphMap
  text: string
  completed?: boolean
  active?: boolean
}) {
  return (
    <View style={styles.step}>
      <View
        style={[
          styles.stepIcon,
          completed && styles.stepIconCompleted,
          active && styles.stepIconActive,
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={completed || active ? 'white' : '#9CA3AF'}
        />
      </View>
      <Text
        style={[
          styles.stepText,
          (completed || active) && styles.stepTextActive,
        ]}
      >
        {text}
      </Text>
      {completed && (
        <Ionicons name="checkmark" size={20} color="#10B981" />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FB923C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  processingIcon: {
    marginVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  progressContainer: {
    width: width - 48,
    marginBottom: 40,
  },
  progressBackground: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  stepsContainer: {
    width: '100%',
    gap: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconCompleted: {
    backgroundColor: '#10B981',
  },
  stepIconActive: {
    backgroundColor: '#FB923C',
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    color: '#9CA3AF',
  },
  stepTextActive: {
    color: '#1F2937',
    fontWeight: '600',
  },
})
