/**
 * QuizInterface Component
 * Main quiz functionality - generate, take, and view results
 */

import React, { useState, useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import QuizGenerator from './QuizGenerator'
import QuizTaking from './QuizTaking'
import QuizResults from './QuizResults'
import LoadingSpinner from '../ui/LoadingSpinner'
import quizService from '../../services/quiz'
import { Quiz, QuizDifficulty } from '../../types'
import { colors } from '../../theme'

interface QuizInterfaceProps {
  contentId: string
  workspaceId: string
}

type QuizState = 'list' | 'generate' | 'taking' | 'results'

export default function QuizInterface({ contentId, workspaceId }: QuizInterfaceProps) {
  const [quizState, setQuizState] = useState<QuizState>('list')
  const [existingQuizzes, setExistingQuizzes] = useState<Quiz[]>([])
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null)
  const [quizResults, setQuizResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadExistingQuizzes()
  }, [contentId])

  const loadExistingQuizzes = async () => {
    try {
      setIsLoading(true)
      const quizzes = await quizService.getQuizzesByContent(contentId)
      setExistingQuizzes(quizzes)
      // If no quizzes exist, go straight to generate
      if (quizzes.length === 0) {
        setQuizState('generate')
      }
    } catch (error) {
      console.error('Error loading quizzes:', error)
      setQuizState('generate')
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuizGenerated = (quiz: Quiz) => {
    setCurrentQuiz(quiz)
    setExistingQuizzes([quiz, ...existingQuizzes])
    setQuizState('taking')
  }

  const handleSelectQuiz = (quiz: Quiz) => {
    setCurrentQuiz(quiz)
    setQuizState('taking')
  }

  const handleQuizSubmit = (results: any) => {
    setQuizResults(results)
    setQuizState('results')
  }

  const handleBackToList = () => {
    setQuizState('list')
    setCurrentQuiz(null)
    setQuizResults(null)
    loadExistingQuizzes()
  }

  if (isLoading) {
    return <LoadingSpinner text="Loading quizzes..." />
  }

  return (
    <View style={styles.container}>
      {quizState === 'list' && (
        <QuizGenerator
          contentId={contentId}
          existingQuizzes={existingQuizzes}
          onQuizGenerated={handleQuizGenerated}
          onSelectQuiz={handleSelectQuiz}
        />
      )}

      {quizState === 'generate' && (
        <QuizGenerator
          contentId={contentId}
          existingQuizzes={[]}
          onQuizGenerated={handleQuizGenerated}
          onSelectQuiz={handleSelectQuiz}
        />
      )}

      {quizState === 'taking' && currentQuiz && (
        <QuizTaking quiz={currentQuiz} onSubmit={handleQuizSubmit} onBack={handleBackToList} />
      )}

      {quizState === 'results' && quizResults && (
        <QuizResults results={quizResults} onBack={handleBackToList} />
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
