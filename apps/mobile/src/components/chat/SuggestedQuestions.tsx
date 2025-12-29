/**
 * SuggestedQuestions Component
 * Display suggested follow-up questions as clickable chips
 */

import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { colors } from '../../theme'

interface SuggestedQuestionsProps {
  questions: string[]
  onQuestionPress: (question: string) => void
}

export default function SuggestedQuestions({ questions, onQuestionPress }: SuggestedQuestionsProps) {
  if (!questions || questions.length === 0) {
    return null
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {questions.map((question, index) => (
        <TouchableOpacity
          key={index}
          style={styles.chip}
          onPress={() => onQuestionPress(question)}
          activeOpacity={0.7}
        >
          <Text style={styles.chipText}>{question}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    paddingLeft: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.primary,
    minHeight: 40,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
})
