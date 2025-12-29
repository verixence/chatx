/**
 * Settings Screen
 * User profile, subscription, and app settings
 */

import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { BackgroundImageWrapper } from '../components/BackgroundImage'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { colors } from '../theme'

interface SubscriptionInfo {
  subscription: string
  displayName: string
  limits: {
    maxContent: number
    features: {
      chat: boolean
      summaries: boolean
      quizzes: boolean
      flashcards: boolean
      unlimitedQuizzes?: boolean
      unlimitedFlashcards?: boolean
      advancedAI?: boolean
    }
  }
  pricing: {
    monthly?: number
    yearly?: number
    unit: string
  }
  usage: {
    content: {
      current: number
      limit: number
      percentage: number
    }
  }
  status: string
  trial?: {
    isActive: boolean
    isExpired: boolean
    daysRemaining: number | null
  }
}

export default function SettingsScreen() {
  const navigation = useNavigation()
  const { user, logout } = useAuth()
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubscriptionInfo()
  }, [])

  const fetchSubscriptionInfo = async () => {
    try {
      const response = await api.get('/api/subscription')
      setSubscriptionInfo(response.data)
    } catch (error) {
      console.error('Error fetching subscription info:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout()
        },
      },
    ])
  }

  const getSubscriptionBadge = () => {
    if (!user) return null

    const isFreemium = user.subscription === 'freemium'
    const isTrial = user.subscription_status === 'trial'

    if (isTrial) {
      return <Badge text="Trial" variant="warning" />
    }

    return (
      <Badge
        text={user.subscription.toUpperCase()}
        variant={isFreemium ? 'default' : 'primary'}
      />
    )
  }

  const getTrialInfo = () => {
    if (!user || user.subscription_status !== 'trial' || !user.subscription_end_date) {
      return null
    }

    const endDate = new Date(user.subscription_end_date)
    const now = new Date()
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysRemaining <= 0) return null

    return (
      <View style={styles.trialInfo}>
        <Text style={styles.trialText}>
          {daysRemaining} days left in your trial
        </Text>
      </View>
    )
  }

  return (
    <BackgroundImageWrapper>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.headerSpacer} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading subscription info...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Profile Section */}
          <Card variant="elevated" style={styles.card}>
            <View style={styles.profileHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{user?.name || 'User'}</Text>
                <Text style={styles.profileEmail}>{user?.email}</Text>
              </View>
            </View>
          </Card>

          {/* Subscription Section */}
          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Subscription</Text>
              {getSubscriptionBadge()}
            </View>

            {getTrialInfo()}

            {/* Subscription Details */}
            {subscriptionInfo && (
              <View style={styles.subscriptionDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Plan:</Text>
                  <Text style={styles.detailValue}>{subscriptionInfo.displayName}</Text>
                </View>

                {subscriptionInfo.pricing.monthly && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Price:</Text>
                    <Text style={styles.detailValue}>
                      ${subscriptionInfo.pricing.monthly}/{subscriptionInfo.pricing.unit}
                    </Text>
                  </View>
                )}

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <Text style={[styles.detailValue, { color: colors.success }]}>
                    {subscriptionInfo.status}
                  </Text>
                </View>
              </View>
            )}

            {/* Usage Information */}
            {subscriptionInfo && (
              <View style={styles.usageInfo}>
                <Text style={styles.usageTitle}>Content Usage</Text>
                <View style={styles.usageRow}>
                  <Text style={styles.usageLabel}>Content Items:</Text>
                  <Text style={styles.usageValue}>
                    {subscriptionInfo.usage.content.current} / {
                      subscriptionInfo.usage.content.limit === 999999
                        ? 'Unlimited'
                        : subscriptionInfo.usage.content.limit
                    }
                  </Text>
                </View>

                {subscriptionInfo.usage.content.limit !== 999999 && (
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBarBackground}>
                      <View
                        style={[
                          styles.progressBar,
                          {
                            width: `${Math.min(subscriptionInfo.usage.content.percentage, 100)}%`,
                            backgroundColor: subscriptionInfo.usage.content.percentage >= 80
                              ? colors.error
                              : subscriptionInfo.usage.content.percentage >= 50
                              ? '#F59E0B'
                              : colors.success
                          }
                        ]}
                      />
                    </View>
                  </View>
                )}

                {/* Features */}
                <Text style={styles.featuresTitle}>Your Features</Text>
                <View style={styles.featuresList}>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text style={styles.featureText}>AI Chat & Summaries</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text style={styles.featureText}>Quizzes & Flashcards</Text>
                  </View>
                  {subscriptionInfo.limits.features.unlimitedQuizzes && (
                    <View style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                      <Text style={styles.featureText}>Unlimited Quizzes & Flashcards</Text>
                    </View>
                  )}
                  {subscriptionInfo.limits.features.advancedAI && (
                    <View style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                      <Text style={styles.featureText}>Advanced AI Features</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Trial Expired Warning */}
            {subscriptionInfo?.trial?.isExpired && (
              <View style={styles.expiredWarning}>
                <Ionicons name="alert-circle" size={20} color={colors.error} />
                <Text style={styles.expiredText}>
                  Your trial has expired. Upgrade to Pro to continue.
                </Text>
              </View>
            )}

            {/* Upgrade Button */}
            {user?.subscription === 'freemium' && (
              <Button
                title="Upgrade to Pro - $9.99/month"
                onPress={() => {
                  Alert.alert(
                    'Upgrade to Pro',
                    'Contact us at info@verixence.com to upgrade your account.',
                    [{ text: 'OK' }]
                  )
                }}
                variant="primary"
                style={styles.upgradeButton}
              />
            )}

            {/* Manage Subscription */}
            {user?.subscription === 'pro' && (
              <Button
                title="Manage Subscription"
                onPress={() => {
                  Alert.alert(
                    'Manage Subscription',
                    'Contact us at info@verixence.com to manage your subscription.',
                    [{ text: 'OK' }]
                  )
                }}
                variant="outline"
                style={styles.manageButton}
              />
            )}
          </Card>

          {/* Support */}
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Support</Text>

            <SettingsItem
              icon="📧"
              title="Contact Support"
              onPress={() => Alert.alert('Contact Support', 'Email us at info@verixence.com')}
            />
          </Card>

          {/* Account */}
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Account</Text>

            <SettingsItem
              icon="🔐"
              title="Change Password"
              onPress={() => {
                Alert.prompt(
                  'Change Password',
                  'Enter your current password:',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Next',
                      onPress: (currentPassword) => {
                        if (!currentPassword) return
                        Alert.prompt(
                          'Change Password',
                          'Enter your new password (min 6 characters):',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Change',
                              onPress: async (newPassword) => {
                                if (!newPassword || newPassword.length < 6) {
                                  Alert.alert('Error', 'Password must be at least 6 characters')
                                  return
                                }
                                try {
                                  const response = await api.post('/api/user/change-password', {
                                    currentPassword,
                                    newPassword
                                  })
                                  Alert.alert('Success', 'Password changed successfully!')
                                } catch (error: any) {
                                  Alert.alert('Error', error.response?.data?.error || 'Failed to change password')
                                }
                              }
                            }
                          ],
                          'secure-text'
                        )
                      }
                    }
                  ],
                  'secure-text'
                )
              }}
            />

            <SettingsItem
              icon="🗑️"
              title="Delete Account"
              subtitle="Permanently delete your account"
              onPress={() => {
                Alert.alert(
                  'Delete Account',
                  'Are you sure you want to permanently delete your account? This action cannot be undone and all your data will be lost.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await api.delete('/api/user')
                          Alert.alert('Success', 'Your account has been deleted.')
                          await logout()
                        } catch (error: any) {
                          Alert.alert('Error', error.response?.data?.error || 'Failed to delete account')
                        }
                      }
                    }
                  ]
                )
              }}
              danger
            />
          </Card>

          {/* Logout Button */}
          <Button
            title="Logout"
            onPress={handleLogout}
            variant="outline"
            size="lg"
            style={styles.logoutButton}
          />

          {/* App Version */}
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </ScrollView>
        )}
      </SafeAreaView>
    </BackgroundImageWrapper>
  )
}

interface SettingsItemProps {
  icon: string
  title: string
  subtitle?: string
  onPress: () => void
  danger?: boolean
}

function SettingsItem({ icon, title, subtitle, onPress, danger }: SettingsItemProps) {
  return (
    <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
      <View style={styles.settingsItemLeft}>
        <Text style={styles.settingsItemIcon}>{icon}</Text>
        <View>
          <Text style={[styles.settingsItemTitle, danger && styles.dangerText]}>
            {title}
          </Text>
          {subtitle && <Text style={styles.settingsItemSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Text style={styles.settingsItemArrow}>›</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: colors.textSecondary,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  trialInfo: {
    padding: 12,
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    marginBottom: 16,
  },
  trialText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
    textAlign: 'center',
  },
  subscriptionDetails: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  usageInfo: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 12,
  },
  usageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  usageLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  usageValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  upgradeText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  progressBarContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  expiredWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    marginTop: 12,
  },
  expiredText: {
    flex: 1,
    fontSize: 14,
    color: colors.error,
    fontWeight: '500',
  },
  upgradeButton: {
    marginTop: 16,
  },
  subscriptionActive: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.success,
    marginBottom: 12,
  },
  manageButton: {
    marginTop: 8,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsItemIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
  },
  settingsItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  settingsItemSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  settingsItemArrow: {
    fontSize: 24,
    color: colors.textTertiary,
  },
  dangerText: {
    color: colors.error,
  },
  logoutButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  versionText: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
    marginBottom: 32,
  },
})
