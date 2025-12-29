/**
 * QuizGenerator Component
 * Select difficulty and question count, then generate quiz
 */

import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native'
import Card from '../ui/Card'
import Button from '../Button'
import LoadingSpinner from '../ui/LoadingSpinner'
import quizService from '../../services/quiz'
import { Quiz, QuizDifficulty } from '../../types'
import { colors } from '../../theme'
import { TouchableOpacity } from 'react-native-gesture-handler'

interface QuizGeneratorProps {
  contentId: string
  existingQuizzes: Quiz[]
  onQuizGenerated: (quiz: Quiz) => void
  onSelectQuiz: (quiz: Quiz) => void
}

const DIFFICULTIES: QuizDifficulty[] = ['easy', 'medium', 'hard']
const QUESTION_COUNTS = [3, 5, 10, 15, 20]

export default function QuizGenerator({
  contentId,
  existingQuizzes,
  onQuizGenerated,
  onSelectQuiz
}: QuizGeneratorProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<QuizDifficulty>('medium')
  const [selectedCount, setSelectedCount] = useState(5)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showGenerator, setShowGenerator] = useState(existingQuizzes.length === 0)

  const handleGenerate = async () => {
    try {
      setIsGenerating(true)

      const quiz = await quizService.generateQuiz({
        contentId,
        difficulty: selectedDifficulty,
        questionCount: selectedCount,
      })

      onQuizGenerated(quiz)
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to generate quiz')
    } finally {
      setIsGenerating(false)
    }
  }

  if (isGenerating) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner text="Generating your quiz..." />
        <Text style={styles.loadingSubtext}>This may take a moment</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Card variant="elevated" style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.headerIcon}>📋</Text>
          <Text style={styles.headerTitle}>
            {showGenerator ? 'Generate Quiz' : 'Your Quizzes'}
          </Text>
        </View>
        <Text style={styles.description}>
          {showGenerator
            ? 'Test your knowledge with AI-generated questions based on this content.'
            : `You have ${existingQuizzes.length} quiz${existingQuizzes.length === 1 ? '' : 'zes'} for this content.`}
        </Text>
      </Card>

      {/* Existing Quizzes List */}
      {!showGenerator && existingQuizzes.length > 0 && (
        <>
          {existingQuizzes.map((quiz, index) => (
            <Card key={quiz.id} style={styles.card}>
              <TouchableOpacity onPress={() => onSelectQuiz(quiz)}>
                <View style={styles.quizItem}>
                  <View style={styles.quizInfo}>
                    <Text style={styles.quizTitle}>
                      Quiz #{existingQuizzes.length - index}
                    </Text>
                    <Text style={styles.quizMeta}>
                      {quiz.questions?.length || 0} questions • {quiz.difficulty || 'medium'}
                    </Text>
                    <Text style={styles.quizDate}>
                      {new Date(quiz.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </View>
              </TouchableOpacity>
            </Card>
          ))}
          <Button
            title="+ Generate New Quiz"
            onPress={() => setShowGenerator(true)}
            variant="primary"
            size="lg"
            style={styles.generateButton}
          />
        </>
      )}

      {/* Quiz Generator Form */}
      {showGenerator && (
        <>

      {/* Difficulty Selection */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Difficulty</Text>
        <View style={styles.optionsRow}>
          {DIFFICULTIES.map((diff) => (
            <TouchableOpacity
              key={diff}
              style={[
                styles.optionButton,
                selectedDifficulty === diff && styles.optionButtonSelected,
              ]}
              onPress={() => setSelectedDifficulty(diff)}
            >
              <Text
                style={[
                  styles.optionText,
                  selectedDifficulty === diff && styles.optionTextSelected,
                ]}
              >
                {diff.charAt(0).toUpperCase() + diff.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Question Count Selection */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Number of Questions</Text>
        <View style={styles.optionsRow}>
          {QUESTION_COUNTS.map((count) => (
            <TouchableOpacity
              key={count}
              style={[
                styles.countButton,
                selectedCount === count && styles.countButtonSelected,
              ]}
              onPress={() => setSelectedCount(count)}
            >
              <Text
                style={[
                  styles.countText,
                  selectedCount === count && styles.countTextSelected,
                ]}
              >
                {count}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      <Button
        title="Generate Quiz"
        onPress={handleGenerate}
        variant="primary"
        size="lg"
        style={styles.generateButton}
      />
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingSubtext: {
    marginTop: 16,
    fontSize: 14,
    color: colors.textSecondary,
  },
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    minWidth: 80,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  optionButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  countButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  countText: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  countTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  generateButton: {
    marginTop: 8,
  },
  quizItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  quizInfo: {
    flex: 1,
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  quizMeta: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  quizDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  chevron: {
    fontSize: 24,
    color: colors.textSecondary,
    marginLeft: 8,
  },
})
