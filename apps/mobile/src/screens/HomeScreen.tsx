/**
 * Home/Marketing Screen
 * Matches web app landing page
 */

import React from 'react'
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { BackgroundImageWrapper } from '../components/BackgroundImage'
import Button from '../components/Button'
import { colors } from '../theme'
import { RootStackParamList } from '../navigation/types'

type NavigationProp = NativeStackNavigationProp<RootStackParamList>

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>()

  return (
    <BackgroundImageWrapper>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header Actions */}
        <View style={styles.headerActions}>
          <Button
            title="Sign in"
            onPress={() => navigation.navigate('Login')}
            variant="outline"
            size="sm"
            style={styles.headerButton}
          />
          <Button
            title="Get started"
            onPress={() => navigation.navigate('Signup')}
            variant="primary"
            size="sm"
            style={styles.headerButton}
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/icon.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.logoText}>ChatX</Text>
            </View>

            <Text style={styles.heroTitle}>
              Re-imagining learning for every student
            </Text>

            <Text style={styles.heroDescription}>
              ChatX transforms content into a dynamic and engaging learning experience tailored for you.
            </Text>

            {/* Features */}
            <View style={styles.featuresContainer}>
              <FeatureItem icon="📚" title="Upload Materials" description="PDFs, YouTube videos, or text" />
              <FeatureItem icon="💬" title="AI Chat" description="Ask questions, get instant answers" />
              <FeatureItem icon="🧠" title="Smart Learning" description="Quizzes, flashcards, and summaries" />
            </View>

            {/* CTA Buttons */}
            <View style={styles.ctaContainer}>
              <Button
                title="Get Started"
                onPress={() => navigation.navigate('Signup')}
                variant="primary"
                size="lg"
                style={styles.ctaButton}
              />
              <Button
                title="Sign In"
                onPress={() => navigation.navigate('Login')}
                variant="outline"
                size="lg"
                style={styles.ctaButton}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </BackgroundImageWrapper>
  )
}

function FeatureItem({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  headerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  heroSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 48,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 48,
    gap: 12,
  },
  logo: {
    width: 48,
    height: 48,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 44,
  },
  heroDescription: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 28,
    paddingHorizontal: 16,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 48,
    gap: 24,
  },
  featureItem: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  featureIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  ctaContainer: {
    width: '100%',
    gap: 16,
  },
  ctaButton: {
    width: '100%',
  },
})

