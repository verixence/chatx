/**
 * ChatInterface Component
 * RAG-based chat with AI about the content
 */

import React, { useState, useEffect, useRef } from 'react'
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform } from 'react-native'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'
import TypingIndicator from './TypingIndicator'
import LoadingSpinner from '../ui/LoadingSpinner'
import SuggestedQuestions from './SuggestedQuestions'
import chatService from '../../services/chat'
import contentService from '../../services/content'
import { ChatMessage, ChatSession, ContentType } from '../../types'
import { colors } from '../../theme'

interface ChatInterfaceProps {
  contentId: string
  workspaceId: string
}

export default function ChatInterface({ contentId, workspaceId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [contentType, setContentType] = useState<ContentType | null>(null)
  const flatListRef = useRef<FlatList>(null)

  useEffect(() => {
    fetchChatHistory()
    fetchContentType()
  }, [contentId])

  const fetchContentType = async () => {
    try {
      const content = await contentService.getContent(contentId)
      if (content) {
        setContentType(content.type)
      }
    } catch (error) {
      console.error('Error fetching content type:', error)
    }
  }

  const generateSuggestedQuestions = (lastMessage: string | undefined): string[] => {
    const suggestions: string[] = []
    if (!lastMessage || typeof lastMessage !== 'string') {
      return suggestions
    }
    const lowerMessage = lastMessage.toLowerCase()

    // Analyze the message content
    const hasDefinition = lowerMessage.includes('what is') || lowerMessage.includes('definition')
    const hasExplanation = lowerMessage.includes('explain') || lowerMessage.includes('how')
    const hasTypes = lowerMessage.includes('type') || lowerMessage.includes('kind') || lowerMessage.includes('category')

    if (hasDefinition || hasExplanation) {
      suggestions.push('Tell me more about this topic')
      suggestions.push('Give me examples')
      suggestions.push('What are the main types?')
    } else if (hasTypes) {
      suggestions.push('Explain each type in detail')
      suggestions.push('What are the effects?')
      suggestions.push('How can we prevent this?')
    } else if (lowerMessage.includes('how') || lowerMessage.includes('why')) {
      suggestions.push('Explain this step by step')
      suggestions.push('What causes this?')
      suggestions.push('Show me examples')
    } else {
      // Default contextual suggestions based on content type
      if (contentType === 'youtube') {
        suggestions.push('Summarize the main points')
        suggestions.push('Explain the key concepts')
        suggestions.push('What should I remember?')
      } else if (contentType === 'pdf') {
        suggestions.push('Explain the main topic')
        suggestions.push('What are the key concepts?')
        suggestions.push('Give me a summary')
      } else {
        suggestions.push('Explain this in detail')
        suggestions.push('What are the main points?')
        suggestions.push('Tell me more')
      }
    }

    return suggestions.slice(0, 3)
  }

  const fetchChatHistory = async () => {
    try {
      setIsLoading(true)
      const { messages: chatMessages, chatSessionId } = await chatService.getChatMessagesByContent(contentId)

      if (chatSessionId) {
        setSessionId(chatSessionId)
      }

      if (chatMessages && chatMessages.length > 0) {
        setMessages(chatMessages)
      } else {
        // No messages yet, add welcome message
        setMessages([
          {
            role: 'assistant',
            message: "Hi! I'm here to help you understand this content. Ask me anything!",
          },
        ])
      }
    } catch (error) {
      console.error('Error fetching chat history:', error)
      setMessages([
        {
          role: 'assistant',
          message: "Hi! I'm here to help you understand this content. Ask me anything!",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return

    // Add user message immediately
    const userMessage: ChatMessage = {
      role: 'user',
      message: text,
    }
    setMessages((prev) => [...prev, userMessage])

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true })
    }, 100)

    try {
      setIsSending(true)

      // Send to API
      const response = await chatService.sendMessage({
        workspaceId,
        contentId,
        message: text,
        sessionId: sessionId || undefined,
      })

      // Update session ID if new
      if (!sessionId && response.sessionId) {
        setSessionId(response.sessionId)
      }

      // Add AI response with suggested questions
      const aiMessage: ChatMessage = {
        role: 'assistant',
        message: response.message,
        message_references: response.references,
        suggestedQuestions: generateSuggestedQuestions(response.message),
      }
      setMessages((prev) => [...prev, aiMessage])

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    } catch (error: any) {
      console.error('Error sending message:', error)

      // Add error message
      const errorMessage: ChatMessage = {
        role: 'assistant',
        message: 'Sorry, I encountered an error. Please try again.',
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsSending(false)
    }
  }

  const handleSuggestedQuestion = (question: string) => {
    handleSendMessage(question)
  }

  if (isLoading) {
    return <LoadingSpinner text="Loading chat..." />
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => item.id || `message-${index}`}
          renderItem={({ item, index }) => {
            const isLastMessage = index === messages.length - 1
            const isAssistant = item.role === 'assistant'
            const showSuggestions = isLastMessage && isAssistant && item.suggestedQuestions && !isSending

            return (
              <View>
                <MessageBubble message={item} />
                {showSuggestions && (
                  <SuggestedQuestions
                    questions={item.suggestedQuestions}
                    onQuestionPress={handleSuggestedQuestion}
                  />
                )}
              </View>
            )
          }}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
        />

        {isSending && <TypingIndicator />}

        <ChatInput onSend={handleSendMessage} disabled={isSending} />
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  keyboardView: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
})
