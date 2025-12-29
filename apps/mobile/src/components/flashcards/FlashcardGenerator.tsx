/**
 * FlashcardGenerator Component
 * Generate flashcards from content
 */

import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native'
import Card from '../ui/Card'
import Button from '../Button'
import LoadingSpinner from '../ui/LoadingSpinner'
import flashcardsService from '../../services/flashcards'
import { Flashcard } from '../../types'
import { colors } from '../../theme'

interface FlashcardGeneratorProps {
  contentId: string
  workspaceId: string
  onFlashcardsGenerated: (flashcards: Flashcard[]) => void
}

export default function FlashcardGenerator({
  contentId,
  workspaceId,
  onFlashcardsGenerated,
}: FlashcardGeneratorProps) {
  const [existingCards, setExistingCards] = useState<Flashcard[]>([])
  const [dueCards, setDueCards] = useState<Flashcard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    fetchExistingCards()
  }, [contentId])

  const fetchExistingCards = async () => {
    try {
      setIsLoading(true)
      const [all, due] = await Promise.all([
        flashcardsService.getFlashcardsByContent(contentId),
        flashcardsService.getDueFlashcards(contentId),
      ])
      setExistingCards(all)
      setDueCards(due)
    } catch (error) {
      console.error('Error fetching flashcards:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerate = async () => {
    try {
      setIsGenerating(true)
      const cards = await flashcardsService.generateFlashcards({
        workspaceId,
        contentId,
        numCards: 20,
      })
      onFlashcardsGenerated(cards)
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to generate flashcards')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleReviewDue = () => {
    if (dueCards.length > 0) {
      onFlashcardsGenerated(dueCards)
    }
  }

  const handleReviewAll = () => {
    if (existingCards.length > 0) {
      onFlashcardsGenerated(existingCards)
    }
  }

  if (isLoading) {
    return <LoadingSpinner text="Loading flashcards..." />
  }

  if (isGenerating) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner text="Generating flashcards..." />
        <Text style={styles.loadingSubtext}>Creating smart study cards</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Card variant="elevated" style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.headerIcon}>🎴</Text>
          <Text style={styles.headerTitle}>Flashcards</Text>
        </View>
        <Text style={styles.description}>
          Review and memorize key concepts with spaced repetition.
        </Text>
      </Card>

      {/* Statistics */}
      {existingCards.length > 0 && (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Your Progress</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{existingCards.length}</Text>
              <Text style={styles.statLabel}>Total Cards</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.warning }]}>
                {dueCards.length}
              </Text>
              <Text style={styles.statLabel}>Due Today</Text>
            </View>
          </View>
        </Card>
      )}

      {/* Actions */}
      {existingCards.length === 0 ? (
        <Card style={styles.card}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyTitle}>No flashcards yet</Text>
          <Text style={styles.emptyText}>
            Generate flashcards to start learning with spaced repetition.
          </Text>
          <Button
            title="Generate Flashcards"
            onPress={handleGenerate}
            variant="primary"
            size="lg"
            style={styles.actionButton}
          />
        </Card>
      ) : (
        <>
          {dueCards.length > 0 && (
            <Button
              title={`Review ${dueCards.length} Due Cards`}
              onPress={handleReviewDue}
              variant="primary"
              size="lg"
              style={styles.button}
            />
          )}

          <Button
            title="Review All Cards"
            onPress={handleReviewAll}
            variant={dueCards.length > 0 ? 'outline' : 'primary'}
            size="lg"
            style={styles.button}
          />

          <Button
            title="Generate More Cards"
            onPress={handleGenerate}
            variant="outline"
            size="lg"
            style={styles.button}
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
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  emptyIcon: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  actionButton: {
    marginTop: 8,
  },
  button: {
    marginBottom: 12,
  },
})
