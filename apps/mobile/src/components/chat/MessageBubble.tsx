/**
 * MessageBubble Component
 * Individual chat message with markdown rendering
 */

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Markdown from 'react-native-markdown-display'
import { ChatMessage } from '../../types'
import { colors } from '../../theme'

interface MessageBubbleProps {
  message: ChatMessage
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const messageText = typeof message.message === 'string' ? message.message : ''

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Markdown
          style={{
            body: { color: isUser ? colors.textPrimary : colors.textPrimary },
            paragraph: { marginVertical: 4 },
            link: { color: colors.primary },
            code_inline: {
              backgroundColor: 'rgba(0,0,0,0.05)',
              paddingHorizontal: 4,
              borderRadius: 4,
            },
          }}
        >
          {messageText}
        </Markdown>

        {/* References */}
        {message.message_references && message.message_references.length > 0 && (
          <View style={styles.referencesContainer}>
            <Text style={styles.referencesTitle}>Sources:</Text>
            {message.message_references.slice(0, 3).map((ref, index) => (
              <View key={index} style={styles.reference}>
                <Text style={styles.referenceText} numberOfLines={2}>
                  {ref.text}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  assistantContainer: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: colors.background,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  referencesContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  referencesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  reference: {
    paddingVertical: 4,
  },
  referenceText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
})
