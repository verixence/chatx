/**
 * Quiz Service
 * Handles quiz generation and submission
 */

import api from './api'
import { Quiz, QuizGenerateRequest, QuizAttempt } from '../types'

export const quizService = {
  /**
   * Generate a new quiz
   */
  async generateQuiz(data: QuizGenerateRequest): Promise<Quiz> {
    try {
      const response = await api.post<Quiz>('/api/quiz/generate', data)
      return response
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to generate quiz')
    }
  },

  /**
   * Get quiz by ID
   */
  async getQuiz(quizId: string): Promise<Quiz> {
    return api.get<Quiz>(`/api/quiz/${quizId}`)
  },

  /**
   * Submit quiz answers
   */
  async submitQuiz(
    quizId: string,
    answers: Record<string, any>
  ): Promise<{ score: number; results: any[] }> {
    try {
      const response = await api.post<{ score: number; results: any[] }>(
        `/api/quiz/${quizId}`,
        { answers }
      )
      return response
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to submit quiz')
    }
  },

  /**
   * Get quiz attempts
   */
  async getQuizAttempts(quizId: string): Promise<QuizAttempt[]> {
    return api.get<QuizAttempt[]>(`/api/quiz/${quizId}/attempts`)
  },

  /**
   * Get quizzes for content
   */
  async getQuizzesByContent(contentId: string): Promise<Quiz[]> {
    return api.get<Quiz[]>(`/api/quiz?contentId=${contentId}`)
  },
}

export default quizService
