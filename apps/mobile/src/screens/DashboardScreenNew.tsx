/**
 * Dashboard Screen - Redesigned
 * Beautiful, mobile-friendly dashboard matching ChatX web design
 */

import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useAuth } from '../context/AuthContext'
import contentService from '../services/content'
import { BackgroundImageWrapper } from '../components/BackgroundImage'
import { Content, Workspace } from '../types'
import { colors } from '../theme'
import { RootStackParamList } from '../navigation/types'
import UploadModal from '../components/UploadModal'

type NavigationProp = NativeStackNavigationProp<RootStackParamList>

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const CARD_WIDTH = SCREEN_WIDTH - 32

export default function DashboardScreenNew() {
  const navigation = useNavigation<NavigationProp>()
  const { user, logout } = useAuth()

  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [recentContent, setRecentContent] = useState<Content[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [uploadModalVisible, setUploadModalVisible] = useState(false)
  const [uploadType, setUploadType] = useState<'pdf' | 'youtube' | 'text' | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchData()
    }, [])
  )

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const workspacesData = await contentService.getWorkspaces()
      setWorkspaces(workspacesData)

      // Combine content from all workspaces
      const allContent: Content[] = []
      for (const workspace of workspacesData) {
        if (workspace.contents && workspace.contents.length > 0) {
          allContent.push(...workspace.contents)
        }
      }
      allContent.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setRecentContent(allContent.slice(0, 10))
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchData()
    setIsRefreshing(false)
  }

  const getTrialDaysRemaining = () => {
    if (!user || user.subscription_status !== 'trial' || !user.subscription_end_date) {
      return null
    }
    const endDate = new Date(user.subscription_end_date)
    const now = new Date()
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysRemaining > 0 ? daysRemaining : 0
  }

  const trialDays = getTrialDaysRemaining()

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return 'document-text'
      case 'youtube':
        return 'logo-youtube'
      case 'text':
        return 'document'
      default:
        return 'document'
    }
  }

  const getContentColor = (type: string) => {
    switch (type) {
      case 'pdf':
        return '#EF4444'
      case 'youtube':
        return '#EF4444'
      case 'text':
        return '#8B5CF6'
      default:
        return colors.primary
    }
  }

  const handleUploadPress = (type: 'pdf' | 'youtube' | 'text') => {
    setUploadType(type)
    setUploadModalVisible(true)
  }

  const handleUploadSuccess = (contentId: string) => {
    setUploadModalVisible(false)
    setUploadType(null)
    // Refresh data
    fetchData()
    // Navigate to the new content's detail screen
    if (workspaces.length > 0) {
      navigation.navigate('ContentDetail', {
        workspaceId: workspaces[0].id,
        contentId: contentId,
      })
    }
  }

  const handleUploadClose = () => {
    setUploadModalVisible(false)
    setUploadType(null)
  }

  return (
    <BackgroundImageWrapper>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.name || 'Student'}</Text>
          </View>
          <View style={styles.headerActions}>
            {trialDays !== null && (
              <View style={styles.trialBadge}>
                <Text style={styles.trialText}>{trialDays} days trial</Text>
              </View>
            )}
            <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.settingsButton}>
              <Ionicons name="settings-outline" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Hero Section */}
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>What do you want to learn today?</Text>
            <Text style={styles.heroSubtitle}>
              Upload your study materials and let AI help you master them
            </Text>
          </View>

          {/* Upload Options */}
          <View style={styles.uploadSection}>
            <TouchableOpacity
              style={styles.uploadCard}
              activeOpacity={0.8}
              onPress={() => handleUploadPress('pdf')}
            >
              <View style={[styles.uploadIconContainer, { backgroundColor: '#FEE2E2' }]}>
                <MaterialCommunityIcons name="file-pdf-box" size={32} color="#EF4444" />
              </View>
              <View style={styles.uploadCardContent}>
                <Text style={styles.uploadCardTitle}>Upload PDF</Text>
                <Text style={styles.uploadCardDescription}>
                  Import textbooks, notes, or documents
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.textTertiary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.uploadCard}
              activeOpacity={0.8}
              onPress={() => handleUploadPress('youtube')}
            >
              <View style={[styles.uploadIconContainer, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="logo-youtube" size={32} color="#EF4444" />
              </View>
              <View style={styles.uploadCardContent}>
                <Text style={styles.uploadCardTitle}>YouTube Video</Text>
                <Text style={styles.uploadCardDescription}>
                  Learn from educational videos
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.textTertiary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.uploadCard}
              activeOpacity={0.8}
              onPress={() => handleUploadPress('text')}
            >
              <View style={[styles.uploadIconContainer, { backgroundColor: '#EDE9FE' }]}>
                <Ionicons name="clipboard" size={32} color="#8B5CF6" />
              </View>
              <View style={styles.uploadCardContent}>
                <Text style={styles.uploadCardTitle}>Paste Text</Text>
                <Text style={styles.uploadCardDescription}>
                  Add your notes or copy content
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* Recent Content */}
          {recentContent.length > 0 && (
            <View style={styles.recentsSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Content</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>See all</Text>
                </TouchableOpacity>
              </View>

              {recentContent.map((content) => (
                <TouchableOpacity
                  key={content.id}
                  style={styles.contentCard}
                  activeOpacity={0.7}
                  onPress={() =>
                    navigation.navigate('ContentDetail', {
                      workspaceId: content.workspace_id,
                      contentId: content.id,
                    })
                  }
                >
                  <View
                    style={[
                      styles.contentIconContainer,
                      { backgroundColor: getContentColor(content.type) + '15' },
                    ]}
                  >
                    <Ionicons
                      name={getContentIcon(content.type) as any}
                      size={24}
                      color={getContentColor(content.type)}
                    />
                  </View>
                  <View style={styles.contentInfo}>
                    <Text style={styles.contentTitle} numberOfLines={1}>
                      {content.title}
                    </Text>
                    <Text style={styles.contentMeta}>
                      {content.type.toUpperCase()} •{' '}
                      {new Date(content.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  {content.status === 'complete' && (
                    <View style={styles.readyBadge}>
                      <Text style={styles.readyText}>Ready</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Empty State */}
          {recentContent.length === 0 && !isLoading && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📚</Text>
              <Text style={styles.emptyTitle}>No content yet</Text>
              <Text style={styles.emptyText}>
                Upload your first study material to get started with AI-powered learning!
              </Text>
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Upload Modal */}
        {uploadModalVisible && workspaces.length > 0 && (
          <UploadModal
            visible={uploadModalVisible}
            onClose={handleUploadClose}
            workspaceId={workspaces[0].id}
            onSuccess={handleUploadSuccess}
            initialType={uploadType}
          />
        )}
      </SafeAreaView>
    </BackgroundImageWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
  greeting: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trialBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  trialText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  hero: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
    lineHeight: 36,
  },
  heroSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  uploadSection: {
    paddingHorizontal: 20,
    gap: 12,
  },
  uploadCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  uploadIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadCardContent: {
    flex: 1,
    marginLeft: 16,
  },
  uploadCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  uploadCardDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  recentsSection: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  contentCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  contentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  contentTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  contentMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  readyBadge: {
    backgroundColor: colors.success + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  readyText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.success,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
