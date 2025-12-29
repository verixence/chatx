/**
 * Chat Service
 * Handles RAG-based chat with content
 */

import api from './api'
import { ChatSession, ChatMessage, ChatRequest, ChatResponse } from '../types'

export const chatService = {
  /**
   * Send a chat message
   */
  async sendMessage(data: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await api.post<ChatResponse>('/api/chat', data)
      return response
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to send message')
    }
  },

  /**
   * Get chat sessions for a workspace
   */
  async getChatSessions(workspaceId: string): Promise<ChatSession[]> {
    return api.get<ChatSession[]>(`/api/chat/sessions?workspaceId=${workspaceId}`)
  },

  /**
   * Get chat messages for specific content
   */
  async getChatMessagesByContent(contentId: string): Promise<{ messages: ChatMessage[], chatSessionId: string | null }> {
    try {
      const response = await api.get<{ messages: ChatMessage[], chatSessionId: string | null }>(`/api/content/${contentId}/chat-messages`)
      return response
    } catch (error) {
      console.error('Error fetching chat messages:', error)
      return { messages: [], chatSessionId: null }
    }
  },

  /**
   * Get messages for a chat session
   */
  async getMessages(sessionId: string): Promise<ChatMessage[]> {
    return api.get<ChatMessage[]>(`/api/chat/sessions/${sessionId}/messages`)
  },

  /**
   * Delete a chat session
   */
  async deleteSession(sessionId: string): Promise<void> {
    await api.delete(`/api/chat/sessions/${sessionId}`)
  },
}

export default chatService
