/**
 * QuizTaking Component
 * Answer quiz questions
 */

import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import Card from '../ui/Card'
import Button from '../Button'
import Input from '../ui/Input'
import LoadingSpinner from '../ui/LoadingSpinner'
import quizService from '../../services/quiz'
import { Quiz, QuizQuestion } from '../../types'
import { colors } from '../../theme'

interface QuizTakingProps {
  quiz: Quiz
  onSubmit: (results: any) => void
  onBack?: () => void
}

export default function QuizTaking({ quiz, onSubmit }: QuizTakingProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentQuestion = quiz.questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100

  const handleAnswerSelect = (answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: answer,
    }))
  }

  const handleNext = () => {
    if (!answers[currentQuestionIndex]) {
      Alert.alert('No Answer', 'Please select an answer before continuing')
      return
    }

    if (isLastQuestion) {
      handleSubmit()
    } else {
      setCurrentQuestionIndex((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    }
  }

  const handleSubmit = async () => {
    if (Object.keys(answers).length !== quiz.questions.length) {
      Alert.alert('Incomplete', 'Please answer all questions before submitting')
      return
    }

    try {
      setIsSubmitting(true)
      const results = await quizService.submitQuiz(quiz.id, answers)
      onSubmit(results)
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit quiz')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitting) {
    return <LoadingSpinner fullScreen text="Grading your quiz..." />
  }

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          Question {currentQuestionIndex + 1} of {quiz.questions.length}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card variant="elevated" style={styles.questionCard}>
          <Text style={styles.questionNumber}>Question {currentQuestionIndex + 1}</Text>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>

          {/* Multiple Choice */}
          {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
            <View style={styles.optionsContainer}>
              {currentQuestion.options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.option,
                    answers[currentQuestionIndex] === option && styles.optionSelected,
                  ]}
                  onPress={() => handleAnswerSelect(option)}
                >
                  <View
                    style={[
                      styles.optionCircle,
                      answers[currentQuestionIndex] === option && styles.optionCircleSelected,
                    ]}
                  >
                    {answers[currentQuestionIndex] === option && (
                      <View style={styles.optionDot} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.optionText,
                      answers[currentQuestionIndex] === option && styles.optionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Short Answer */}
          {currentQuestion.type === 'short_answer' && (
            <Input
              value={(answers[currentQuestionIndex] as string) || ''}
              onChangeText={(text) => handleAnswerSelect(text)}
              placeholder="Type your answer..."
              multiline
              style={styles.shortAnswerInput}
            />
          )}
        </Card>
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        <Button
          title="Previous"
          onPress={handlePrevious}
          variant="outline"
          disabled={currentQuestionIndex === 0}
          style={styles.navButton}
        />
        <Button
          title={isLastQuestion ? 'Submit Quiz' : 'Next'}
          onPress={handleNext}
          variant="primary"
          style={styles.navButton}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  progressContainer: {
    padding: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.muted,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  questionCard: {
    marginBottom: 16,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 20,
    lineHeight: 26,
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  optionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCircleSelected: {
    borderColor: colors.primary,
  },
  optionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
  },
  optionTextSelected: {
    fontWeight: '600',
  },
  shortAnswerInput: {
    minHeight: 100,
  },
  navigationContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  navButton: {
    flex: 1,
  },
})
