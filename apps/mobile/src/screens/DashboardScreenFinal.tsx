/**
 * Dashboard Screen - Final Production Version
 * Beautiful mobile dashboard matching ChatX web design exactly
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
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useAuth } from '../context/AuthContext'
import contentService from '../services/content'
import { Content, Workspace } from '../types'
import { RootStackParamList } from '../navigation/types'

type NavigationProp = NativeStackNavigationProp<RootStackParamList>

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function DashboardScreenFinal() {
  const navigation = useNavigation<NavigationProp>()
  const { user, logout } = useAuth()

  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [recentContent, setRecentContent] = useState<Content[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [uploadModalVisible, setUploadModalVisible] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

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
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFF5F0', '#FFE5D1']}
        style={StyleSheet.absoluteFillObject}
      />

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
            <TouchableOpacity onPress={logout} style={styles.logoutButton}>
              <Ionicons name="log-out-outline" size={22} color="#111827" />
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
              activeOpacity={0.8}
              onPress={() => setUploadModalVisible(true)}
            >
              <View style={[styles.uploadIconLarge, { backgroundColor: '#FEE2E2' }]}>
                <MaterialCommunityIcons name="file-pdf-box" size={40} color="#EF4444" />
              </View>
              <Text style={styles.uploadCardLargeTitle}>PDF Document</Text>
              <Text style={styles.uploadCardLargeSubtitle}>Click or drag & drop</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.uploadCardLarge}
              activeOpacity={0.8}
              onPress={() => setUploadModalVisible(true)}
            >
              <View style={[styles.uploadIconLarge, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="logo-youtube" size={40} color="#EF4444" />
              </View>
              <Text style={styles.uploadCardLargeTitle}>YouTube Video</Text>
              <Text style={styles.uploadCardLargeSubtitle}>Paste video URL</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.uploadCardLarge}
              activeOpacity={0.8}
              onPress={() => setUploadModalVisible(true)}
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
                <TouchableOpacity>
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
                          size={28}
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

        {/* Floating Action Button */}
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.9}
          onPress={() => setUploadModalVisible(true)}
        >
          <LinearGradient
            colors={['#FB923C', '#F97316']}
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>

      {/* Upload Modal Placeholder */}
      <Modal
        visible={uploadModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setUploadModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Upload will be implemented next!</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setUploadModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
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
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },
  greeting: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  trialBadge: {
    backgroundColor: '#FB923C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#FB923C',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  trialText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  logoutButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    fontWeight: '400',
  },
  uploadSection: {
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 24,
  },
  uploadCardLarge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FB923C' + '20',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
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
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadCardLargeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  uploadCardLargeSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  recentsSection: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  contentThumbnail: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  contentIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
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
    marginBottom: 6,
    lineHeight: 20,
  },
  contentMeta: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981' + '15',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  readyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  readyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
    letterSpacing: 0.3,
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
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    ...Platform.select({
      ios: {
        shadowColor: '#FB923C',
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
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 24,
    textAlign: 'center',
  },
  modalCloseButton: {
    backgroundColor: '#FB923C',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
})
