/**
 * Flashcards Service
 * Handles flashcard generation and spaced repetition
 */

import api from './api'
import { Flashcard, FlashcardGenerateRequest, FlashcardReview } from '../types'

export const flashcardsService = {
  /**
   * Generate flashcards for content
   */
  async generateFlashcards(data: FlashcardGenerateRequest): Promise<Flashcard[]> {
    try {
      const response = await api.post<Flashcard[]>('/api/flashcards/generate', data)
      return response
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to generate flashcards')
    }
  },

  /**
   * Get flashcards for content
   */
  async getFlashcardsByContent(contentId: string): Promise<Flashcard[]> {
    return api.get<Flashcard[]>(`/api/flashcards?contentId=${contentId}`)
  },

  /**
   * Get flashcards due for review
   */
  async getDueFlashcards(contentId: string): Promise<Flashcard[]> {
    return api.get<Flashcard[]>(`/api/flashcards?contentId=${contentId}&due=true`)
  },

  /**
   * Review a flashcard (record performance)
   */
  async reviewFlashcard(
    flashcardId: string,
    quality: number // 0-5 (0=complete blackout, 5=perfect)
  ): Promise<Flashcard> {
    try {
      const response = await api.post<Flashcard>(`/api/flashcards/${flashcardId}/review`, {
        quality,
      })
      return response
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to review flashcard')
    }
  },

  /**
   * Get review history for a flashcard
   */
  async getReviewHistory(flashcardId: string): Promise<FlashcardReview[]> {
    return api.get<FlashcardReview[]>(`/api/flashcards/${flashcardId}/reviews`)
  },

  /**
   * Delete a flashcard
   */
  async deleteFlashcard(flashcardId: string): Promise<void> {
    await api.delete(`/api/flashcards/${flashcardId}`)
  },
}

export default flashcardsService
