/**
 * Content Service
 * Handles content upload, processing, and retrieval
 */

import api from './api'
import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system'
import { Content, Workspace, UploadResponse } from '../types'

export const contentService = {
  /**
   * Get all workspaces for the current user
   */
  async getWorkspaces(): Promise<Workspace[]> {
    const response = await api.get<{ workspaces: Workspace[] }>('/api/workspace')
    return response.workspaces
  },

  /**
   * Get a specific workspace
   */
  async getWorkspace(id: string): Promise<Workspace> {
    return api.get<Workspace>(`/api/workspace/${id}`)
  },

  /**
   * Create a new workspace
   */
  async createWorkspace(data: { name: string; description?: string }): Promise<Workspace> {
    const response = await api.post<{ workspace: Workspace }>('/api/workspace', data)
    return response.workspace
  },

  /**
   * Get content items for a workspace
   */
  async getContentByWorkspace(workspaceId: string): Promise<Content[]> {
    return api.get<Content[]>(`/api/workspace/${workspaceId}/content`)
  },

  /**
   * Get a specific content item
   */
  async getContent(contentId: string): Promise<Content> {
    return api.get<Content>(`/api/content/${contentId}`)
  },


  /**
   * Upload a PDF file
   */
  async uploadPDF(workspaceId: string, onProgress?: (progress: number) => void): Promise<UploadResponse> {
    try {
      // Pick document
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      })

      if (result.canceled || !result.assets[0]) {
        throw new Error('No file selected')
      }

      const file = result.assets[0]

      // Check file size (max 10MB)
      const maxSizeInBytes = 10 * 1024 * 1024 // 10MB
      if (file.size && file.size > maxSizeInBytes) {
        const sizeInMB = (file.size / (1024 * 1024)).toFixed(2)
        throw new Error(`File is too large (${sizeInMB}MB). Maximum size is 10MB. Please try a smaller file.`)
      }

      // Create FormData for upload
      const uploadFormData = new FormData()
      uploadFormData.append('file', {
        uri: file.uri,
        type: 'application/pdf',
        name: file.name,
      } as any)
      uploadFormData.append('workspaceId', workspaceId)

      // Upload file
      const uploadResponse = await api.uploadFile<{ path: string; url: string }>(
        '/api/upload',
        uploadFormData,
        onProgress
      )

      // Ingest the PDF using FormData
      const ingestFormData = new FormData()
      ingestFormData.append('workspaceId', workspaceId)
      ingestFormData.append('type', 'pdf')
      ingestFormData.append('storagePath', uploadResponse.path)

      const ingestResponse = await api.uploadFile<UploadResponse>(
        '/api/ingest',
        ingestFormData
      )

      return ingestResponse
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to upload PDF'
      console.error('PDF upload error:', errorMessage)
      throw new Error(errorMessage)
    }
  },

  /**
   * Ingest YouTube video
   */
  async ingestYouTube(workspaceId: string, url: string): Promise<UploadResponse> {
    try {
      const formData = new FormData()
      formData.append('workspaceId', workspaceId)
      formData.append('type', 'youtube')
      formData.append('url', url)

      const response = await api.uploadFile<UploadResponse>('/api/ingest', formData)

      return response
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to ingest YouTube video'
      console.error('YouTube upload error:', errorMessage)
      throw new Error(errorMessage)
    }
  },

  /**
   * Ingest text/notes
   */
  async ingestText(workspaceId: string, text: string, title: string): Promise<UploadResponse> {
    try {
      const formData = new FormData()
      formData.append('workspaceId', workspaceId)
      formData.append('type', 'text')
      formData.append('text', text)
      formData.append('title', title)

      const response = await api.uploadFile<UploadResponse>('/api/ingest', formData)

      return response
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to ingest text'
      console.error('Text upload error:', errorMessage)
      throw new Error(errorMessage)
    }
  },

  /**
   * Get content processing status
   */
  async getProcessingStatus(contentId: string): Promise<{ status: string; progress?: number }> {
    return api.get<{ status: string; progress?: number }>(`/api/content/${contentId}/status`)
  },

  /**
   * Get PDF signed URL
   */
  async getPDFUrl(contentId: string): Promise<string> {
    const response = await api.get<{ url: string }>(`/api/content/${contentId}/pdf-url`)
    return response.url
  },

  /**
   * Delete content
   */
  async deleteContent(contentId: string): Promise<void> {
    await api.delete(`/api/content/${contentId}`)
  },

  /**
   * Send chat message and get AI response
   * Uses POST /api/chat with workspaceId, contentId, and message
   */
  async sendChatMessage(
    contentId: string,
    workspaceId: string,
    message: string
  ): Promise<{ answer: string; chatSessionId?: string; references?: any[] }> {
    try {
      const response = await api.post<{ answer: string; chatSessionId?: string; references?: any[] }>(
        `/api/chat`,
        {
          workspaceId,
          contentId,
          message,
        }
      )
      return response
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to send message')
    }
  },

  /**
   * Get chat history for content
   */
  async getChatHistory(contentId: string): Promise<Array<{ role: string; content: string; timestamp: string }>> {
    try {
      const response = await api.get<{ messages: Array<{ role: string; content: string; timestamp: string }> }>(
        `/api/content/${contentId}/chat-messages`
      )
      return response.messages || []
    } catch (error) {
      return []
    }
  },

  /**
   * Get processed content (includes summary)
   */
  async getProcessedContent(contentId: string): Promise<{ summary?: string; chunks?: any[]; embeddings?: any[] }> {
    try {
      const response = await api.get<{ processed: any; content: any }>(
        `/api/content/${contentId}/processed`
      )
      return response.processed || {}
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to load processed content')
    }
  },

  /**
   * Get flashcards for content
   */
  async getFlashcards(contentId: string): Promise<Array<{ id: string; question: string; answer: string }>> {
    try {
      const response = await api.get<{ flashcards: Array<{ id: string; question: string; answer: string }> }>(
        `/api/flashcards?contentId=${contentId}`
      )
      return response.flashcards || []
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to load flashcards')
    }
  },

  /**
   * Generate new flashcards
   */
  async generateFlashcards(
    workspaceId: string,
    contentId: string,
    numCards: number = 10
  ): Promise<Array<{ id: string; question: string; answer: string }>> {
    try {
      const response = await api.post<{ flashcards: Array<{ id: string; question: string; answer: string }> }>(
        `/api/flashcards/generate`,
        {
          workspaceId,
          contentId,
          numCards,
        }
      )
      return response.flashcards || []
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to generate flashcards')
    }
  },

  /**
   * Get quizzes for content
   */
  async getQuizzes(contentId: string): Promise<any[]> {
    try {
      const response = await api.get<{ quizzes: any[] }>(
        `/api/quiz?contentId=${contentId}`
      )
      return response.quizzes || []
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to load quizzes')
    }
  },

  /**
   * Generate new quiz
   */
  async generateQuiz(
    workspaceId: string,
    contentId: string,
    numQuestions: number = 5,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium'
  ): Promise<any> {
    try {
      const response = await api.post<{ quiz: any }>(
        `/api/quiz/generate`,
        {
          workspaceId,
          contentId,
          numQuestions,
          difficulty,
        }
      )
      return response.quiz
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to generate quiz')
    }
  },

  /**
   * Submit quiz answers
   */
  async submitQuiz(quizId: string, answers: string[]): Promise<{ results: any[]; score: number }> {
    try {
      const response = await api.post<{ results: any[]; score: number }>(
        `/api/quiz/${quizId}`,
        { answers }
      )
      return response
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to submit quiz')
    }
  },
}

export default contentService
