/**
 * FlashcardReview Component
 * Review flashcards with swipe gestures and spaced repetition
 */

import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Animated, PanResponder } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Card from '../ui/Card'
import Button from '../Button'
import flashcardsService from '../../services/flashcards'
import { Flashcard } from '../../types'
import { colors } from '../../theme'

interface FlashcardReviewProps {
  flashcards: Flashcard[]
  onFinish: () => void
}

export default function FlashcardReview({ flashcards, onFinish }: FlashcardReviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [reviewedCount, setReviewedCount] = useState(0)

  const currentCard = flashcards[currentIndex]
  const progress = ((currentIndex + 1) / flashcards.length) * 100

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  const handleRating = async (quality: number) => {
    try {
      // Submit review to API
      await flashcardsService.reviewFlashcard(currentCard.id, quality)

      // Move to next card
      if (currentIndex < flashcards.length - 1) {
        setCurrentIndex((prev) => prev + 1)
        setIsFlipped(false)
        setReviewedCount((prev) => prev + 1)
      } else {
        // Finished all cards
        setReviewedCount((prev) => prev + 1)
        // Show completion
      }
    } catch (error) {
      console.error('Error reviewing flashcard:', error)
    }
  }

  const isFinished = reviewedCount >= flashcards.length

  if (isFinished) {
    return (
      <View style={styles.completionContainer}>
        <Text style={styles.completionIcon}>🎉</Text>
        <Text style={styles.completionTitle}>Review Complete!</Text>
        <Text style={styles.completionText}>
          You reviewed {flashcards.length} flashcards.
        </Text>
        <Button
          title="Finish"
          onPress={onFinish}
          variant="primary"
          size="lg"
          style={styles.finishButton}
        />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {currentIndex + 1} / {flashcards.length}
        </Text>
      </View>

      {/* Flashcard */}
      <View style={styles.cardContainer}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleFlip}
          style={styles.flashcardTouch}
        >
          <Card variant="elevated" style={styles.flashcard}>
            <Text style={styles.cardLabel}>{isFlipped ? 'Answer' : 'Question'}</Text>
            <Text style={styles.cardText}>
              {isFlipped ? currentCard.answer : currentCard.question}
            </Text>
            <Text style={styles.flipHint}>Tap to flip</Text>
          </Card>
        </TouchableOpacity>
      </View>

      {/* Rating Buttons */}
      {isFlipped && (
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingTitle}>How well did you know this?</Text>
          <View style={styles.ratingButtons}>
            <TouchableOpacity
              style={[styles.ratingButton, styles.hardButton]}
              onPress={() => handleRating(1)}
            >
              <Text style={styles.ratingEmoji}>😰</Text>
              <Text style={styles.ratingLabel}>Hard</Text>
              <Text style={styles.ratingSubtext}>Again soon</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.ratingButton, styles.mediumButton]}
              onPress={() => handleRating(3)}
            >
              <Text style={styles.ratingEmoji}>🤔</Text>
              <Text style={styles.ratingLabel}>Medium</Text>
              <Text style={styles.ratingSubtext}>Few days</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.ratingButton, styles.easyButton]}
              onPress={() => handleRating(5)}
            >
              <Text style={styles.ratingEmoji}>😊</Text>
              <Text style={styles.ratingLabel}>Easy</Text>
              <Text style={styles.ratingSubtext}>Week+</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
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
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  flashcardTouch: {
    flex: 1,
  },
  flashcard: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  cardText: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 36,
  },
  flipHint: {
    position: 'absolute',
    bottom: 16,
    fontSize: 12,
    color: colors.textTertiary,
  },
  ratingContainer: {
    padding: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  ratingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  ratingButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  ratingButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  hardButton: {
    borderColor: colors.error,
    backgroundColor: `${colors.error}10`,
  },
  mediumButton: {
    borderColor: colors.warning,
    backgroundColor: `${colors.warning}10`,
  },
  easyButton: {
    borderColor: colors.success,
    backgroundColor: `${colors.success}10`,
  },
  ratingEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  ratingSubtext: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  completionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: colors.backgroundSecondary,
  },
  completionIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  completionText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  finishButton: {
    minWidth: 200,
  },
})
