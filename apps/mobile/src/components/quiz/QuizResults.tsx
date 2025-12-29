/**
 * QuizResults Component
 * Display quiz score and review answers
 */

import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import Card from '../ui/Card'
import Button from '../Button'
import Badge from '../ui/Badge'
import { colors } from '../../theme'

interface QuizResultsProps {
  results: {
    score: number
    results: Array<{
      question: string
      userAnswer: string
      correctAnswer: string
      isCorrect: boolean
      explanation: string
    }>
  }
  onBack: () => void
}

export default function QuizResults({ results, onBack }: QuizResultsProps) {
  const percentage = Math.round((results.score / results.results.length) * 100)
  const passed = percentage >= 70

  const getScoreColor = () => {
    if (percentage >= 90) return colors.success
    if (percentage >= 70) return colors.warning
    return colors.error
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Score Card */}
      <Card variant="elevated" style={styles.scoreCard}>
        <View style={styles.scoreHeader}>
          <Text style={styles.scoreIcon}>{passed ? '🎉' : '📚'}</Text>
          <Text style={styles.scoreTitle}>
            {passed ? 'Great Job!' : 'Keep Learning!'}
          </Text>
        </View>

        <View style={styles.scoreContainer}>
          <Text style={[styles.scorePercentage, { color: getScoreColor() }]}>
            {percentage}%
          </Text>
          <Text style={styles.scoreText}>
            {results.score} out of {results.results.length} correct
          </Text>
        </View>

        <Badge
          text={passed ? 'Passed' : 'Not Passed'}
          variant={passed ? 'success' : 'error'}
          style={styles.badge}
        />
      </Card>

      {/* Review Section */}
      <Text style={styles.reviewTitle}>Review Answers</Text>

      {results.results.map((result, index) => (
        <Card key={index} style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <Text style={styles.questionNumber}>Question {index + 1}</Text>
            <Badge
              text={result.isCorrect ? 'Correct' : 'Incorrect'}
              variant={result.isCorrect ? 'success' : 'error'}
            />
          </View>

          <Text style={styles.questionText}>{result.question}</Text>

          <View style={styles.answerSection}>
            <View style={styles.answerRow}>
              <Text style={styles.answerLabel}>Your Answer:</Text>
              <Text
                style={[
                  styles.answerValue,
                  result.isCorrect ? styles.correctAnswer : styles.incorrectAnswer,
                ]}
              >
                {result.userAnswer}
              </Text>
            </View>

            {!result.isCorrect && (
              <View style={styles.answerRow}>
                <Text style={styles.answerLabel}>Correct Answer:</Text>
                <Text style={[styles.answerValue, styles.correctAnswer]}>
                  {result.correctAnswer}
                </Text>
              </View>
            )}
          </View>

          {result.explanation && (
            <View style={styles.explanationSection}>
              <Text style={styles.explanationLabel}>Explanation:</Text>
              <Text style={styles.explanationText}>{result.explanation}</Text>
            </View>
          )}
        </Card>
      ))}

      <Button
        title="Back to Quizzes"
        onPress={onBack}
        variant="primary"
        size="lg"
        style={styles.retakeButton}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  scrollContent: {
    padding: 16,
  },
  scoreCard: {
    marginBottom: 24,
    alignItems: 'center',
  },
  scoreHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  scoreTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  scorePercentage: {
    fontSize: 64,
    fontWeight: '700',
  },
  scoreText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  badge: {
    marginTop: 8,
  },
  reviewTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  questionCard: {
    marginBottom: 16,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
    lineHeight: 24,
  },
  answerSection: {
    marginBottom: 12,
  },
  answerRow: {
    marginBottom: 8,
  },
  answerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  answerValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  correctAnswer: {
    color: colors.success,
  },
  incorrectAnswer: {
    color: colors.error,
  },
  explanationSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  explanationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  explanationText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  retakeButton: {
    marginTop: 8,
    marginBottom: 32,
  },
})
