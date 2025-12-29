/**
 * Dashboard Screen - Production Version
 * Beautiful mobile dashboard matching ChatX web design
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
  Image,
  Platform,
  Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useAuth } from '../context/AuthContext'
import contentService from '../services/content'
import UploadModal from '../components/UploadModal'
import { BackgroundImageWrapper } from '../components/BackgroundImage'
import { Content, Workspace } from '../types'
import { RootStackParamList } from '../navigation/types'

type NavigationProp = NativeStackNavigationProp<RootStackParamList>

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function DashboardScreen() {
  const navigation = useNavigation<NavigationProp>()
  const { user, logout } = useAuth()

  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [recentContent, setRecentContent] = useState<Content[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [uploadModalVisible, setUploadModalVisible] = useState(false)
  const [uploadType, setUploadType] = useState<'pdf' | 'youtube' | 'text' | undefined>(undefined)
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const workspacesData = await contentService.getWorkspaces()
      setWorkspaces(workspacesData)

      // Get or create default workspace
      let defaultWorkspace = workspacesData[0]
      if (!defaultWorkspace && workspacesData.length === 0) {
        defaultWorkspace = await contentService.createWorkspace({
          name: 'My Workspace',
          description: 'Default workspace',
        })
        setWorkspaces([defaultWorkspace])
      }
      setCurrentWorkspaceId(defaultWorkspace?.id || null)

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

  const handleUploadSuccess = () => {
    fetchData()
    setUploadModalVisible(false)
    setUploadType(undefined)
  }

  const handleOpenUpload = (type: 'pdf' | 'youtube' | 'text') => {
    if (!currentWorkspaceId) {
      contentService.createWorkspace({
        name: 'My Workspace',
        description: 'Default workspace',
      }).then((workspace) => {
        setCurrentWorkspaceId(workspace.id)
        setUploadType(type)
        setUploadModalVisible(true)
      })
    } else {
      setUploadType(type)
      setUploadModalVisible(true)
    }
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

  const extractYouTubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
  }

  const getContentThumbnail = (content: Content) => {
    if (content.type === 'youtube' && content.raw_url) {
      const videoId = extractYouTubeId(content.raw_url)
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      }
    }
    return null
  }

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
        return '#FB923C'
    }
  }

  const trialDays = getTrialDaysRemaining()

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
                <Text style={styles.trialText}>{trialDays} Days Free Trial</Text>
              </View>
            )}
            <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.settingsButton}>
              <Ionicons name="settings-outline" size={22} color="#111827" />
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
            <Text style={styles.heroTitle}>What do you want to{'\n'}learn today?</Text>
            <Text style={styles.heroSubtitle}>
              Upload your materials and let AI help you study smarter
            </Text>
          </View>

          {/* Upload Cards */}
          <View style={styles.uploadSection}>
            <TouchableOpacity
              style={styles.uploadCardLarge}
              activeOpacity={0.7}
              onPress={() => handleOpenUpload('pdf')}
            >
              <View style={[styles.uploadIconLarge, { backgroundColor: '#FEE2E2' }]}>
                <MaterialCommunityIcons name="file-pdf-box" size={40} color="#EF4444" />
              </View>
              <Text style={styles.uploadCardLargeTitle}>PDF Document</Text>
              <Text style={styles.uploadCardLargeSubtitle}>Click or drag & drop</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.uploadCardLarge}
              activeOpacity={0.7}
              onPress={() => handleOpenUpload('youtube')}
            >
              <View style={[styles.uploadIconLarge, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="logo-youtube" size={40} color="#EF4444" />
              </View>
              <Text style={styles.uploadCardLargeTitle}>YouTube Video</Text>
              <Text style={styles.uploadCardLargeSubtitle}>Paste video URL</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.uploadCardLarge}
              activeOpacity={0.7}
              onPress={() => handleOpenUpload('text')}
            >
              <View style={[styles.uploadIconLarge, { backgroundColor: '#EDE9FE' }]}>
                <Ionicons name="clipboard-outline" size={40} color="#8B5CF6" />
              </View>
              <Text style={styles.uploadCardLargeTitle}>Paste Text</Text>
              <Text style={styles.uploadCardLargeSubtitle}>Notes, articles, etc.</Text>
            </TouchableOpacity>
          </View>

          {/* Recent Content */}
          {recentContent.length > 0 && (
            <View style={styles.recentsSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Content</Text>
                <TouchableOpacity
                  onPress={() => {
                    if (currentWorkspaceId) {
                      navigation.navigate('Workspace', { id: currentWorkspaceId })
                    }
                  }}
                  activeOpacity={0.6}
                >
                  <Text style={styles.seeAllText}>See all</Text>
                </TouchableOpacity>
              </View>

              {recentContent.map((content) => {
                const thumbnail = getContentThumbnail(content)
                return (
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
                    {thumbnail ? (
                      <Image source={{ uri: thumbnail }} style={styles.contentThumbnail} />
                    ) : (
                      <View
                        style={[
                          styles.contentIconContainer,
                          { backgroundColor: getContentColor(content.type) + '15' },
                        ]}
                      >
                        <Ionicons
                          name={getContentIcon(content.type) as any}
                          size={32}
                          color={getContentColor(content.type)}
                        />
                      </View>
                    )}
                    <View style={styles.contentInfo}>
                      <Text style={styles.contentTitle} numberOfLines={2}>
                        {content.title}
                      </Text>
                      <Text style={styles.contentMeta}>
                        {content.type.toUpperCase()} •{' '}
                        {new Date(content.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                    </View>
                    {content.status === 'complete' && (
                      <View style={styles.readyBadge}>
                        <View style={styles.readyDot} />
                        <Text style={styles.readyText}>Ready</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )
              })}
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
      </SafeAreaView>

      {/* Upload Modal */}
      <UploadModal
        visible={uploadModalVisible}
        onClose={() => setUploadModalVisible(false)}
        workspaceId={currentWorkspaceId || ''}
        onSuccess={handleUploadSuccess}
        initialType={uploadType}
      />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  greeting: {
    fontSize: 14,
    color: '#6B7280',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trialBadge: {
    backgroundColor: '#FB923C',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  trialText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    lineHeight: 42,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 22,
  },
  uploadSection: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  uploadCardLarge: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  uploadIconLarge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadCardLargeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
    textAlign: 'center',
  },
  uploadCardLargeSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  recentsSection: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FB923C',
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  contentThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
  },
  contentIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentInfo: {
    flex: 1,
    marginLeft: 14,
  },
  contentTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    lineHeight: 20,
  },
  contentMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  readyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 5,
  },
  readyText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
})

