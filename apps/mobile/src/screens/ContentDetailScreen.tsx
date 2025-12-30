/**
 * ContentDetail Screen - Production Version with Full Backend Integration
 * All tabs fully functional with real API calls
 */

import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
  FlatList,
  Alert,
  Animated,
  Keyboard,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import Markdown from 'react-native-markdown-display'
import { LinearGradient } from 'expo-linear-gradient'
import { BackgroundImageWrapper } from '../components/BackgroundImage'
import contentService from '../services/content'
import { Content } from '../types'
import { RootStackParamList } from '../navigation/types'

type ContentDetailRouteProp = RouteProp<RootStackParamList, 'ContentDetail'>
type NavigationProp = NativeStackNavigationProp<RootStackParamList>

type TabKey = 'chat' | 'summary' | 'flashcards' | 'quizzes'

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

interface Flashcard {
  id: string
  question: string
  answer: string
  isFlipped: boolean
  known: boolean | null
}

interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  selectedAnswer: number | null
  explanation?: string
}

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function ContentDetailScreen() {
  const route = useRoute<ContentDetailRouteProp>()
  const navigation = useNavigation<NavigationProp>()
  const { workspaceId, contentId } = route.params

  const [content, setContent] = useState<Content | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('chat')
  const [isLoading, setIsLoading] = useState(true)
  const [isFocusMode, setIsFocusMode] = useState(false)

  // Chat state
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const flatListRef = useRef<FlatList>(null)

  // Summary state
  const [summary, setSummary] = useState<string>('')
  const [keyPoints, setKeyPoints] = useState<string[]>([])
  const [isSummaryLoading, setIsSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)

  // Flashcards state
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlashcardsLoading, setIsFlashcardsLoading] = useState(false)
  const [flashcardsError, setFlashcardsError] = useState<string | null>(null)
  const flipAnim = useRef(new Animated.Value(0)).current

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isQuizLoading, setIsQuizLoading] = useState(false)
  const [quizError, setQuizError] = useState<string | null>(null)
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [score, setScore] = useState(0)

  const quickActions = [
    { id: 'summarize', label: 'Summarize', icon: 'document-text-outline' },
    { id: 'explain', label: 'Explain concepts', icon: 'bulb-outline' },
    { id: 'quiz', label: 'Create quiz', icon: 'help-circle-outline' },
    { id: 'key-points', label: 'Key points', icon: 'list-outline' },
  ]

  useEffect(() => {
    fetchContent()

    // Poll for content status if processing
    const pollInterval = setInterval(() => {
      // Keep polling if status is 'processing' - stop once it's 'ready' or 'complete'
      if (content?.status === 'processing') {
        fetchContent()
      }
    }, 3000) // Check every 3 seconds

    return () => clearInterval(pollInterval)
  }, [contentId, content?.status])

  useEffect(() => {
    // Keyboard listeners for better input visibility
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height)
      }
    )
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0)
      }
    )

    return () => {
      keyboardWillShow.remove()
      keyboardWillHide.remove()
    }
  }, [])

  useEffect(() => {
    // Load tab data when switching tabs - content is usable when 'ready', 'complete', or 'partial'
    // 'partial' means video has no transcript but metadata is available
    if (content?.status === 'complete' || content?.status === 'ready' || content?.status === 'partial') {
      switch (activeTab) {
        case 'summary':
          loadSummary()
          break
        case 'flashcards':
          loadFlashcards()
          break
        case 'quizzes':
          loadQuiz()
          break
      }
    }
  }, [activeTab, content])

  const fetchContent = async () => {
    try {
      setIsLoading(true)
      const contentData = await contentService.getContent(contentId)
      setContent(contentData)

      // Load chat history - content is usable when 'ready', 'complete', or 'partial'
      // 'partial' means video has no transcript but basic info is available
      if (contentData.status === 'complete' || contentData.status === 'ready' || contentData.status === 'partial') {
        loadChatHistory(contentData)
      }
    } catch (error) {
      console.error('Error fetching content:', error)
      Alert.alert('Error', 'Failed to load content')
    } finally {
      setIsLoading(false)
    }
  }

  const loadChatHistory = async (contentData: Content) => {
    try {
      const history = await contentService.getChatHistory(contentId)
      const chatMessages: Message[] = history.map((msg, idx) => ({
        id: `${idx}`,
        text: msg.content,
        isUser: msg.role === 'user',
        timestamp: new Date(msg.timestamp),
      }))

      if (chatMessages.length === 0) {
        // Add welcome message with actual content title
        setMessages([
          {
            id: '0',
            text: `Hi! I'm ready to help you understand "${contentData.title}". Ask me anything!`,
            isUser: false,
            timestamp: new Date(),
          },
        ])
      } else {
        setMessages(chatMessages)
      }
    } catch (error) {
      // Start with welcome message on error
      setMessages([
        {
          id: '0',
          text: `Hi! I'm ready to help you understand your content. Ask me anything!`,
          isUser: false,
          timestamp: new Date(),
        },
      ])
    }
  }

  const loadSummary = async () => {
    if (summary) return // Already loaded

    try {
      setIsSummaryLoading(true)
      setSummaryError(null)
      const data = await contentService.getProcessedContent(contentId)
      setSummary(data.summary || '')
      // Extract key points from summary if available (first few bullet points)
      if (data.summary) {
        const lines = data.summary.split('\n')
        const points = lines
          .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
          .map(line => line.replace(/^[-*]\s*/, '').trim())
          .slice(0, 5)
        setKeyPoints(points)
      }
    } catch (error: any) {
      setSummaryError(error.message || 'Failed to load summary')
    } finally {
      setIsSummaryLoading(false)
    }
  }

  const loadFlashcards = async () => {
    if (flashcards.length > 0) return // Already loaded

    try {
      setIsFlashcardsLoading(true)
      setFlashcardsError(null)
      const cards = await contentService.getFlashcards(contentId)
      setFlashcards(cards.map(card => ({ ...card, isFlipped: false, known: null })))
    } catch (error: any) {
      setFlashcardsError(error.message || 'Failed to load flashcards')
    } finally {
      setIsFlashcardsLoading(false)
    }
  }

  const handleGenerateNewFlashcards = async () => {
    try {
      setIsFlashcardsLoading(true)
      setFlashcardsError(null)
      const generated = await contentService.generateFlashcards(workspaceId, contentId, 10)
      setFlashcards([...flashcards, ...generated].map(card => ({ ...card, isFlipped: false, known: null })))
      setCurrentCardIndex(0)
    } catch (error: any) {
      setFlashcardsError(error.message || 'Failed to generate flashcards')
    } finally {
      setIsFlashcardsLoading(false)
    }
  }

  const [currentQuiz, setCurrentQuiz] = useState<any>(null)

  const loadQuiz = async () => {
    if (quizQuestions.length > 0) return // Already loaded

    try {
      setIsQuizLoading(true)
      setQuizError(null)
      const quizzes = await contentService.getQuizzes(contentId)

      if (quizzes.length > 0) {
        // Use most recent quiz
        const latestQuiz = quizzes[0]
        setCurrentQuiz(latestQuiz)
        const questions = latestQuiz.questions.map((q: any, idx: number) => ({
          id: `${latestQuiz.id}-${idx}`,
          question: q.question,
          options: q.options || [],
          correctAnswer: q.options?.indexOf(q.correctAnswer) || 0,
          selectedAnswer: null,
          explanation: q.explanation,
        }))
        setQuizQuestions(questions)
      }
    } catch (error: any) {
      setQuizError(error.message || 'Failed to load quiz')
    } finally {
      setIsQuizLoading(false)
    }
  }

  const handleGenerateNewQuiz = async () => {
    try {
      setIsQuizLoading(true)
      setQuizError(null)
      const quiz = await contentService.generateQuiz(workspaceId, contentId, 5, 'medium')
      setCurrentQuiz(quiz)
      const questions = quiz.questions.map((q: any, idx: number) => ({
        id: `${quiz.id}-${idx}`,
        question: q.question,
        options: q.options || [],
        correctAnswer: q.options?.indexOf(q.correctAnswer) || 0,
        selectedAnswer: null,
        explanation: q.explanation,
      }))
      setQuizQuestions(questions)
      setCurrentQuestionIndex(0)
      setQuizSubmitted(false)
      setScore(0)
    } catch (error: any) {
      setQuizError(error.message || 'Failed to generate quiz')
    } finally {
      setIsQuizLoading(false)
    }
  }

  const extractYouTubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
  }

  const getContentThumbnail = () => {
    if (!content) return null
    if (content.type === 'youtube' && content.raw_url) {
      const videoId = extractYouTubeId(content.raw_url)
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      }
    }
    return null
  }

  const getContentIcon = () => {
    if (!content) return 'document'
    switch (content.type) {
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

  const handleSendMessage = async () => {
    if (!inputText.trim() || isSending) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const messageToSend = inputText.trim()
    setInputText('')
    setIsSending(true)

    try {
      const response = await contentService.sendChatMessage(contentId, workspaceId, messageToSend)

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.answer,
        isUser: false,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMessage])
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send message')
      // Remove the user message on error
      setMessages(prev => prev.filter(m => m.id !== userMessage.id))
    } finally {
      setIsSending(false)
    }
  }

  const handleQuickAction = (actionId: string) => {
    let actionText = ''
    switch (actionId) {
      case 'summarize':
        actionText = 'Can you summarize the main points?'
        break
      case 'explain':
        actionText = 'Explain the main concepts in simple terms'
        break
      case 'quiz':
        actionText = 'Create a quiz to test my understanding'
        break
      case 'key-points':
        actionText = 'What are the key takeaways?'
        break
    }
    setInputText(actionText)
  }

  const flipCard = (cardIndex: number) => {
    const newFlashcards = [...flashcards]
    const card = newFlashcards[cardIndex]

    Animated.sequence([
      Animated.timing(flipAnim, {
        toValue: 90,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(flipAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start()

    setTimeout(() => {
      card.isFlipped = !card.isFlipped
      setFlashcards(newFlashcards)
    }, 150)
  }

  const markCardKnown = (known: boolean) => {
    const newFlashcards = [...flashcards]
    newFlashcards[currentCardIndex].known = known
    setFlashcards(newFlashcards)

    // Move to next card after a brief delay
    setTimeout(() => {
      if (currentCardIndex < flashcards.length - 1) {
        setCurrentCardIndex(currentCardIndex + 1)
      }
    }, 300)
  }

  const selectAnswer = (questionIndex: number, answerIndex: number) => {
    if (quizSubmitted) return

    const newQuestions = [...quizQuestions]
    newQuestions[questionIndex].selectedAnswer = answerIndex
    setQuizQuestions(newQuestions)
  }

  const submitQuiz = async () => {
    if (!currentQuiz) {
      // Fallback to local scoring if no quiz ID
      let correctCount = 0
      quizQuestions.forEach(q => {
        if (q.selectedAnswer === q.correctAnswer) {
          correctCount++
        }
      })
      setScore(correctCount)
      setQuizSubmitted(true)
      return
    }

    try {
      const answers = quizQuestions.map(q => q.options[q.selectedAnswer || 0] || '')
      const result = await contentService.submitQuiz(currentQuiz.id, answers)
      setScore(result.score)
      setQuizSubmitted(true)
    } catch (error: any) {
      // Fallback to local scoring on error
      let correctCount = 0
      quizQuestions.forEach(q => {
        if (q.selectedAnswer === q.correctAnswer) {
          correctCount++
        }
      })
      setScore(correctCount)
      setQuizSubmitted(true)
    }
  }

  const renderHeroSection = () => {
    const thumbnail = getContentThumbnail()
    const isVideo = content?.type === 'youtube'

    // Large hero for YouTube videos
    if (isVideo) {
      return (
        <View style={styles.hero}>
          <View style={styles.thumbnailContainer}>
            <Image source={{ uri: thumbnail! }} style={styles.thumbnail} />
            <View style={styles.playOverlay}>
              <View style={styles.playButton}>
                <Ionicons name="play" size={32} color="#FFFFFF" />
              </View>
            </View>
          </View>
          <View style={styles.heroMeta}>
            <Text style={styles.contentTitle} numberOfLines={2}>
              {content?.title || 'Loading...'}
            </Text>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                <Text style={styles.metaText}>
                  {content?.created_at
                    ? new Date(content.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : ''}
                </Text>
              </View>
              {content?.type && (
                <View style={styles.metaItem}>
                  <View style={[styles.typeBadge, { backgroundColor: '#FEE2E2' }]}>
                    <Text style={styles.typeBadgeText}>{content.type.toUpperCase()}</Text>
                  </View>
                </View>
              )}
              {(content?.status === 'complete' || content?.status === 'ready' || content?.status === 'partial') && (
                <View style={styles.metaItem}>
                  <View style={styles.readyDot} />
                  <Text style={styles.readyText}>Ready</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )
    }

    // Compact hero for PDF and Text content
    return (
      <View style={styles.heroCompact}>
        <View style={styles.compactIconContainer}>
          <View
            style={[
              styles.compactIcon,
              {
                backgroundColor:
                  content?.type === 'pdf' ? '#FEE2E2' : '#EDE9FE',
              },
            ]}
          >
            <Ionicons
              name={getContentIcon() as any}
              size={28}
              color={content?.type === 'pdf' ? '#EF4444' : '#8B5CF6'}
            />
          </View>
        </View>
        <View style={styles.compactContent}>
          <Text style={styles.compactTitle} numberOfLines={2}>
            {content?.title || 'Loading...'}
          </Text>
          <View style={styles.compactMetaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={12} color="#6B7280" />
              <Text style={styles.compactMetaText}>
                {content?.created_at
                  ? new Date(content.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })
                  : ''}
              </Text>
            </View>
            {content?.type && (
              <View style={styles.metaItem}>
                <View style={[styles.typeBadge, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={styles.typeBadgeText}>{content.type.toUpperCase()}</Text>
                </View>
              </View>
            )}
            {(content?.status === 'complete' || content?.status === 'ready' || content?.status === 'partial') && (
              <View style={styles.metaItem}>
                <View style={styles.readyDot} />
                <Text style={styles.compactMetaText}>Ready</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    )
  }

  const renderTabs = () => {
    const tabs: Array<{ key: TabKey; label: string; icon: string }> = [
      { key: 'chat', label: 'Chat', icon: 'chatbubble-outline' },
      { key: 'summary', label: 'Summary', icon: 'document-text-outline' },
      { key: 'flashcards', label: 'Flashcards', icon: 'albums-outline' },
      { key: 'quizzes', label: 'Quizzes', icon: 'help-circle-outline' },
    ]

    return (
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={tab.icon as any}
                size={18}
                color={activeTab === tab.key ? '#FB923C' : '#6B7280'}
              />
              <Text
                style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    )
  }

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.isUser ? styles.userMessageContainer : styles.aiMessageContainer,
      ]}
    >
      {!item.isUser && (
        <View style={styles.aiAvatar}>
          <Ionicons name="sparkles" size={16} color="#FB923C" />
        </View>
      )}
      <View
        style={[
          styles.messageBubble,
          item.isUser ? styles.userBubble : styles.aiBubble,
        ]}
      >
        <Text style={[styles.messageText, item.isUser && styles.userMessageText]}>
          {item.text}
        </Text>
      </View>
    </View>
  )

  const renderChatTab = () => {
    // Content is usable when 'ready', 'complete', or 'partial'
    const isContentReady = content?.status === 'complete' || content?.status === 'ready' || content?.status === 'partial'

    if (!isContentReady) {
      return (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color="#FB923C" />
          <Text style={styles.processingTitle}>Processing Content</Text>
          <Text style={styles.processingText}>
            Your content is being processed. This usually takes 10-30 seconds.
          </Text>
          <Text style={[styles.processingText, { fontSize: 13, marginTop: 8, opacity: 0.7 }]}>
            Auto-checking every 3 seconds...
          </Text>
          <TouchableOpacity
            onPress={fetchContent}
            style={{
              marginTop: 20,
              paddingHorizontal: 24,
              paddingVertical: 12,
              backgroundColor: '#FB923C',
              borderRadius: 8
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>
              Check Now
            </Text>
          </TouchableOpacity>
        </View>
      )
    }

    return (
      <View style={styles.chatContainer}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={
            isSending ? (
              <View style={styles.typingIndicator}>
                <View style={styles.aiAvatar}>
                  <Ionicons name="sparkles" size={16} color="#FB923C" />
                </View>
                <View style={styles.typingBubble}>
                  <View style={styles.typingDots}>
                    <View style={styles.typingDot} />
                    <View style={styles.typingDot} />
                    <View style={styles.typingDot} />
                  </View>
                </View>
              </View>
            ) : null
          }
        />

        <View style={{ paddingBottom: keyboardHeight }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsContainer}
          >
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionChip}
                onPress={() => handleQuickAction(action.id)}
                activeOpacity={0.7}
              >
                <Ionicons name={action.icon as any} size={16} color="#FB923C" />
                <Text style={styles.quickActionText}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask anything about this content..."
                placeholderTextColor="#9CA3AF"
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                onPress={handleSendMessage}
                disabled={!inputText.trim() || isSending}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={inputText.trim() ? ['#FB923C', '#F97316'] : ['#D1D5DB', '#D1D5DB']}
                  style={styles.sendButtonGradient}
                >
                  <Ionicons name="send" size={20} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    )
  }

  const renderSummaryTab = () => {
    // Content is usable when 'ready', 'complete', or 'partial'
    const isContentReady = content?.status === 'complete' || content?.status === 'ready' || content?.status === 'partial'

    if (!isContentReady) {
      return (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color="#FB923C" />
          <Text style={styles.processingTitle}>Processing Content</Text>
          <Text style={styles.processingText}>
            This usually takes 10-30 seconds.
            </Text>
            <Text style={[styles.processingText, { fontSize: 13, marginTop: 8, opacity: 0.7 }]}>
              Auto-checking every 3 seconds...
          </Text>
        </View>
      )
    }

    if (isSummaryLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FB923C" />
          <Text style={styles.loadingText}>Generating summary...</Text>
        </View>
      )
    }

    if (summaryError) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Failed to Load Summary</Text>
          <Text style={styles.errorText}>{summaryError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadSummary}>
            <LinearGradient colors={['#FB923C', '#F97316']} style={styles.retryButtonGradient}>
              <Ionicons name="refresh" size={20} color="#FFFFFF" />
              <Text style={styles.retryButtonText}>Retry</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )
    }

    return (
      <ScrollView style={styles.summaryContainer} contentContainerStyle={styles.summaryContent}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>AI Summary</Text>
        </View>

        {keyPoints.length > 0 && (
          <View style={styles.keyPointsContainer}>
            <Text style={styles.keyPointsTitle}>Key Points</Text>
            {keyPoints.map((point, index) => (
              <View key={index} style={styles.keyPoint}>
                <View style={styles.keyPointBullet} />
                <Text style={styles.keyPointText}>{point}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.summaryTextContainer}>
          <Markdown
            style={markdownStyles}
          >
            {summary || 'No summary available yet.'}
          </Markdown>
        </View>
      </ScrollView>
    )
  }

  const renderFlashcardsTab = () => {
    // Content is usable when 'ready', 'complete', or 'partial'
    const isContentReady = content?.status === 'complete' || content?.status === 'ready' || content?.status === 'partial'

    if (!isContentReady) {
      return (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color="#FB923C" />
          <Text style={styles.processingTitle}>Processing Content</Text>
          <Text style={styles.processingText}>
            This usually takes 10-30 seconds.
            </Text>
            <Text style={[styles.processingText, { fontSize: 13, marginTop: 8, opacity: 0.7 }]}>
              Auto-checking every 3 seconds...
          </Text>
        </View>
      )
    }

    if (isFlashcardsLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FB923C" />
          <Text style={styles.loadingText}>Generating flashcards...</Text>
        </View>
      )
    }

    if (flashcardsError) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Failed to Load Flashcards</Text>
          <Text style={styles.errorText}>{flashcardsError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadFlashcards}>
            <LinearGradient colors={['#FB923C', '#F97316']} style={styles.retryButtonGradient}>
              <Ionicons name="refresh" size={20} color="#FFFFFF" />
              <Text style={styles.retryButtonText}>Retry</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )
    }

    if (flashcards.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="albums-outline" size={64} color="#FB923C" />
          <Text style={styles.emptyTitle}>No Flashcards Yet</Text>
          <Text style={styles.emptyText}>Generate flashcards to start studying!</Text>
          <TouchableOpacity style={styles.generateButton} onPress={handleGenerateNewFlashcards}>
            <LinearGradient colors={['#FB923C', '#F97316']} style={styles.generateButtonGradient}>
              <Text style={styles.generateButtonText}>Generate Flashcards</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )
    }

    const currentCard = flashcards[currentCardIndex]
    const mastered = flashcards.filter(c => c.known === true).length
    const reviewing = flashcards.filter(c => c.known === false).length

    return (
      <View style={styles.flashcardsContainer}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              Card {currentCardIndex + 1} of {flashcards.length}
            </Text>
            <Text style={styles.progressStats}>
              Mastered: {mastered} • Reviewing: {reviewing}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${((mastered + reviewing) / flashcards.length) * 100}%` },
              ]}
            />
          </View>
        </View>

        {/* Flashcard */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => flipCard(currentCardIndex)}
          style={styles.flashcardTouchable}
        >
          <Animated.View
            style={[
              styles.flashcard,
              {
                transform: [
                  {
                    rotateY: flipAnim.interpolate({
                      inputRange: [0, 90],
                      outputRange: ['0deg', '90deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.flashcardContent}>
              <Text style={styles.flashcardLabel}>
                {currentCard.isFlipped ? 'Answer' : 'Question'}
              </Text>
              <Text style={styles.flashcardText}>
                {currentCard.isFlipped ? currentCard.answer : currentCard.question}
              </Text>
              <View style={styles.tapHint}>
                <Ionicons name="hand-left-outline" size={20} color="#9CA3AF" />
                <Text style={styles.tapHintText}>Tap to flip</Text>
              </View>
            </View>
          </Animated.View>
        </TouchableOpacity>

        {/* Action Buttons */}
        {currentCard.isFlipped && (
          <View style={styles.flashcardActions}>
            <TouchableOpacity
              style={[styles.flashcardActionButton, styles.dontKnowButton]}
              onPress={() => markCardKnown(false)}
            >
              <Ionicons name="close-circle" size={24} color="#EF4444" />
              <Text style={styles.dontKnowText}>Don't Know</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.flashcardActionButton, styles.knowButton]}
              onPress={() => markCardKnown(true)}
            >
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              <Text style={styles.knowText}>Know It!</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Navigation & Regenerate */}
        <View style={styles.flashcardFooter}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => setCurrentCardIndex(Math.max(0, currentCardIndex - 1))}
            disabled={currentCardIndex === 0}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={currentCardIndex === 0 ? '#D1D5DB' : '#FB923C'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.regenerateFlashcardsButton}
            onPress={handleGenerateNewFlashcards}
          >
            <Ionicons name="refresh-outline" size={18} color="#FB923C" />
            <Text style={styles.regenerateFlashcardsText}>New Set</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() =>
              setCurrentCardIndex(Math.min(flashcards.length - 1, currentCardIndex + 1))
            }
            disabled={currentCardIndex === flashcards.length - 1}
          >
            <Ionicons
              name="chevron-forward"
              size={24}
              color={currentCardIndex === flashcards.length - 1 ? '#D1D5DB' : '#FB923C'}
            />
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const renderQuizzesTab = () => {
    // Content is usable when 'ready', 'complete', or 'partial'
    const isContentReady = content?.status === 'complete' || content?.status === 'ready' || content?.status === 'partial'

    if (!isContentReady) {
      return (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color="#FB923C" />
          <Text style={styles.processingTitle}>Processing Content</Text>
          <Text style={styles.processingText}>
            This usually takes 10-30 seconds.
            </Text>
            <Text style={[styles.processingText, { fontSize: 13, marginTop: 8, opacity: 0.7 }]}>
              Auto-checking every 3 seconds...
          </Text>
        </View>
      )
    }

    if (isQuizLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FB923C" />
          <Text style={styles.loadingText}>Generating quiz...</Text>
        </View>
      )
    }

    if (quizError) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Failed to Load Quiz</Text>
          <Text style={styles.errorText}>{quizError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadQuiz}>
            <LinearGradient colors={['#FB923C', '#F97316']} style={styles.retryButtonGradient}>
              <Ionicons name="refresh" size={20} color="#FFFFFF" />
              <Text style={styles.retryButtonText}>Retry</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )
    }

    if (quizQuestions.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="help-circle-outline" size={64} color="#FB923C" />
          <Text style={styles.emptyTitle}>No Quiz Yet</Text>
          <Text style={styles.emptyText}>Generate a quiz to test your knowledge!</Text>
          <TouchableOpacity style={styles.generateButton} onPress={handleGenerateNewQuiz}>
            <LinearGradient colors={['#FB923C', '#F97316']} style={styles.generateButtonGradient}>
              <Text style={styles.generateButtonText}>Generate Quiz</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )
    }

    if (quizSubmitted) {
      return (
        <ScrollView style={styles.quizContainer} contentContainerStyle={styles.quizContent}>
          <View style={styles.quizScoreContainer}>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreNumber}>
                {score}/{quizQuestions.length}
              </Text>
              <Text style={styles.scoreLabel}>Score</Text>
            </View>
            <Text style={styles.scorePercentage}>
              {Math.round((score / quizQuestions.length) * 100)}% Correct
            </Text>
          </View>

          <View style={styles.quizResults}>
            {quizQuestions.map((question, index) => {
              const isCorrect = question.selectedAnswer === question.correctAnswer
              return (
                <View key={question.id} style={styles.resultItem}>
                  <View style={styles.resultHeader}>
                    <Text style={styles.resultQuestion}>
                      {index + 1}. {question.question}
                    </Text>
                    {isCorrect ? (
                      <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                    ) : (
                      <Ionicons name="close-circle" size={24} color="#EF4444" />
                    )}
                  </View>
                  <Text style={styles.resultAnswer}>
                    Your answer: {question.options[question.selectedAnswer!]}
                  </Text>
                  {!isCorrect && (
                    <Text style={styles.resultCorrectAnswer}>
                      Correct answer: {question.options[question.correctAnswer]}
                    </Text>
                  )}
                  {question.explanation && (
                    <View style={styles.explanation}>
                      <Text style={styles.explanationText}>{question.explanation}</Text>
                    </View>
                  )}
                </View>
              )
            })}
          </View>

          <TouchableOpacity style={styles.newQuizButton} onPress={handleGenerateNewQuiz}>
            <LinearGradient colors={['#FB923C', '#F97316']} style={styles.newQuizButtonGradient}>
              <Ionicons name="refresh" size={20} color="#FFFFFF" />
              <Text style={styles.newQuizButtonText}>Try New Quiz</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      )
    }

    return (
      <ScrollView style={styles.quizContainer} contentContainerStyle={styles.quizContent}>
        <View style={styles.quizHeader}>
          <Text style={styles.quizTitle}>Quiz Time!</Text>
          <Text style={styles.quizSubtitle}>
            {quizQuestions.filter(q => q.selectedAnswer !== null).length}/{quizQuestions.length} answered
          </Text>
        </View>

        {quizQuestions.map((question, questionIndex) => (
          <View key={question.id} style={styles.questionCard}>
            <Text style={styles.questionNumber}>Question {questionIndex + 1}</Text>
            <Text style={styles.questionText}>{question.question}</Text>
            <View style={styles.optionsContainer}>
              {question.options.map((option, optionIndex) => (
                <TouchableOpacity
                  key={optionIndex}
                  style={[
                    styles.option,
                    question.selectedAnswer === optionIndex && styles.optionSelected,
                  ]}
                  onPress={() => selectAnswer(questionIndex, optionIndex)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.radio,
                      question.selectedAnswer === optionIndex && styles.radioSelected,
                    ]}
                  >
                    {question.selectedAnswer === optionIndex && (
                      <View style={styles.radioDot} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.optionText,
                      question.selectedAnswer === optionIndex && styles.optionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={[
            styles.submitButton,
            quizQuestions.some(q => q.selectedAnswer === null) && styles.submitButtonDisabled,
          ]}
          onPress={submitQuiz}
          disabled={quizQuestions.some(q => q.selectedAnswer === null)}
        >
          <LinearGradient colors={['#FB923C', '#F97316']} style={styles.submitButtonGradient}>
            <Text style={styles.submitButtonText}>Submit Quiz</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'chat':
        return renderChatTab()
      case 'summary':
        return renderSummaryTab()
      case 'flashcards':
        return renderFlashcardsTab()
      case 'quizzes':
        return renderQuizzesTab()
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#FFF5F0', '#FFE5D1']}
          style={StyleSheet.absoluteFillObject}
        />
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FB923C" />
          <Text style={styles.loadingText}>Loading content...</Text>
        </SafeAreaView>
      </View>
    )
  }

  if (!content) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#FFF5F0', '#FFE5D1']}
          style={StyleSheet.absoluteFillObject}
        />
        <SafeAreaView style={styles.errorContainer}>
          <Text style={styles.errorText}>Content not found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backLink}>Go back</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    )
  }

  return (
    <BackgroundImageWrapper>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {content.title}
          </Text>
          <TouchableOpacity
            onPress={() => setIsFocusMode(!isFocusMode)}
            style={styles.focusButton}
          >
            <Ionicons
              name={isFocusMode ? 'eye' : 'eye-outline'}
              size={22}
              color="#111827"
            />
          </TouchableOpacity>
        </View>

        {/* Hero Section */}
        {!isFocusMode && renderHeroSection()}

        {/* Tabs */}
        {renderTabs()}

        {/* Tab Content */}
        <View style={styles.content}>{renderTabContent()}</View>
      </SafeAreaView>
    </BackgroundImageWrapper>
  )
}

const markdownStyles = StyleSheet.create({
  body: {
    fontSize: 15,
    lineHeight: 24,
    color: '#111827',
  },
  heading1: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 12,
  },
  heading2: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 10,
  },
  heading3: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 12,
    marginBottom: 8,
  },
  paragraph: {
    marginBottom: 12,
    lineHeight: 24,
  },
  list_item: {
    marginBottom: 6,
  },
  bullet_list: {
    marginBottom: 12,
  },
  ordered_list: {
    marginBottom: 12,
  },
  strong: {
    fontWeight: '600',
  },
  em: {
    fontStyle: 'italic',
  },
  code_inline: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  code_block: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  backLink: {
    fontSize: 16,
    color: '#FB923C',
    fontWeight: '600',
  },
  retryButton: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  backButton: {
    marginRight: 12,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  focusButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    backgroundColor: '#FFFFFF',
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
  heroCompact: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
    minHeight: 88,
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
  compactIconContainer: {
    flexShrink: 0,
  },
  compactIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactContent: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    lineHeight: 22,
  },
  compactMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  compactMetaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  thumbnailContainer: {
    width: '100%',
    height: 220,
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(251, 146, 60, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroMeta: {
    padding: 20,
  },
  contentTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    lineHeight: 28,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#6B7280',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EF4444',
  },
  readyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  readyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  tabsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#FB923C',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabLabelActive: {
    color: '#FB923C',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
    gap: 12,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
    flexDirection: 'row-reverse',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#3B82F6',
  },
  aiBubble: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  messageText: {
    fontSize: 15,
    color: '#111827',
    lineHeight: 21,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  typingBubble: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  quickActionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  quickActionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FED7AA',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FB923C',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  processingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  processingText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Summary Tab Styles
  summaryContainer: {
    flex: 1,
  },
  summaryContent: {
    padding: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  regenerateText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FB923C',
  },
  keyPointsContainer: {
    backgroundColor: '#FFFBF5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  keyPointsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  keyPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  keyPointBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FB923C',
    marginTop: 8,
  },
  keyPointText: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
  },
  summaryTextContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },

  // Flashcards Tab Styles
  flashcardsContainer: {
    flex: 1,
    padding: 20,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  progressStats: {
    fontSize: 13,
    color: '#6B7280',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FB923C',
    borderRadius: 4,
  },
  flashcardTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flashcard: {
    width: SCREEN_WIDTH - 40,
    minHeight: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  flashcardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flashcardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FB923C',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  flashcardText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 28,
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 24,
  },
  tapHintText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  flashcardActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  flashcardActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  dontKnowButton: {
    backgroundColor: '#FEE2E2',
  },
  knowButton: {
    backgroundColor: '#D1FAE5',
  },
  dontKnowText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  knowText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  flashcardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  regenerateFlashcardsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  regenerateFlashcardsText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FB923C',
  },

  // Quiz Tab Styles
  quizContainer: {
    flex: 1,
  },
  quizContent: {
    padding: 20,
  },
  quizHeader: {
    marginBottom: 24,
  },
  quizTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  quizSubtitle: {
    fontSize: 15,
    color: '#6B7280',
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
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
  questionNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FB923C',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  questionText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionSelected: {
    backgroundColor: '#FFF5F0',
    borderColor: '#FB923C',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#FB923C',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FB923C',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    lineHeight: 21,
  },
  optionTextSelected: {
    fontWeight: '600',
    color: '#FB923C',
  },
  submitButton: {
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  quizScoreContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  scoreCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFF5F0',
    borderWidth: 8,
    borderColor: '#FB923C',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  scoreNumber: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FB923C',
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 4,
  },
  scorePercentage: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  quizResults: {
    gap: 16,
    marginBottom: 24,
  },
  resultItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  resultQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 21,
  },
  resultAnswer: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  resultCorrectAnswer: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  explanation: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFFBF5',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FB923C',
  },
  explanationText: {
    fontSize: 13,
    color: '#111827',
    lineHeight: 19,
  },
  newQuizButton: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  newQuizButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  newQuizButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Empty/Generate States
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  generateButton: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  generateButtonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
})
