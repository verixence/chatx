/**
 * FlashcardsInterface Component
 * Main flashcards functionality with spaced repetition
 */

import React, { useState } from 'react'
import { View, StyleSheet } from 'react-native'
import FlashcardGenerator from './FlashcardGenerator'
import FlashcardReview from './FlashcardReview'
import { Flashcard } from '../../types'
import { colors } from '../../theme'

interface FlashcardsInterfaceProps {
  contentId: string
  workspaceId: string
}

type FlashcardState = 'generate' | 'review'

export default function FlashcardsInterface({ contentId, workspaceId }: FlashcardsInterfaceProps) {
  const [flashcardState, setFlashcardState] = useState<FlashcardState>('generate')
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])

  const handleFlashcardsGenerated = (cards: Flashcard[]) => {
    setFlashcards(cards)
    setFlashcardState('review')
  }

  const handleBackToGenerate = () => {
    setFlashcardState('generate')
    setFlashcards([])
  }

  return (
    <View style={styles.container}>
      {flashcardState === 'generate' && (
        <FlashcardGenerator
          contentId={contentId}
          workspaceId={workspaceId}
          onFlashcardsGenerated={handleFlashcardsGenerated}
        />
      )}

      {flashcardState === 'review' && flashcards.length > 0 && (
        <FlashcardReview
          flashcards={flashcards}
          onFinish={handleBackToGenerate}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
})
