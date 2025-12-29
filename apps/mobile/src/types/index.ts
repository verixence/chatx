/**
 * Shared TypeScript types and interfaces
 * Matching web app data models
 */

export type SubscriptionTier = 'freemium' | 'pro' | 'enterprise'
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trial'
export type ContentType = 'pdf' | 'youtube' | 'audio' | 'video' | 'text'
export type ContentStatus = 'processing' | 'complete' | 'error' | 'ready' | 'partial'
export type QuizDifficulty = 'easy' | 'medium' | 'hard'
export type QuestionType = 'multiple_choice' | 'short_answer'
export type MessageRole = 'user' | 'assistant' | 'system'

export interface User {
  id: string
  email: string
  name: string | null
  image: string | null
  subscription: SubscriptionTier
  subscription_status: SubscriptionStatus
  subscription_start_date: string | null
  subscription_end_date: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  content_count: number
  created_at: string
  updated_at: string
}

export interface Workspace {
  id: string
  user_id: string
  name: string
  description: string | null
  tags: string[]
  shared: boolean
  share_token: string | null
  created_at: string
  updated_at: string
}

export interface Content {
  id: string
  workspace_id: string
  type: ContentType
  raw_url: string | null
  extracted_text: string | null
  metadata: Record<string, any> | null
  title: string
  status: ContentStatus
  file_size: number | null
  created_at: string
  updated_at: string
}

export interface ProcessedContent {
  id: string
  content_id: string
  chunks: ContentChunk[]
  embeddings: number[][] | null
  summary: string | null
  transcript: string | null
  graph_json: Record<string, any> | null
  created_at: string
  updated_at: string
}

export interface ContentChunk {
  text: string
  index: number
  timestamp?: number
}

export interface ChatSession {
  id: string
  workspace_id: string
  user_id: string
  content_id: string | null
  messages: ChatMessage[]
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id?: string
  chat_session_id?: string
  role: MessageRole
  message: string
  message_references?: MessageReference[]
  suggestedQuestions?: string[]
  created_at?: string
}

export interface MessageReference {
  chunkIndex: number
  text: string
  score?: number
}

export interface Quiz {
  id: string
  workspace_id: string
  content_id: string
  questions: QuizQuestion[]
  difficulty: QuizDifficulty
  created_at: string
  updated_at: string
}

export interface QuizQuestion {
  id?: string
  question: string
  type: QuestionType
  options?: string[]
  correctAnswer: string | string[]
  explanation: string
  userAnswer?: string | string[]
}

export interface QuizAttempt {
  id: string
  quiz_id: string
  user_id: string
  answers: Record<string, any>
  score: number
  completed_at: string
}

export interface Flashcard {
  id: string
  workspace_id: string
  content_id: string
  question: string
  answer: string
  difficulty: number // SM-2 easiness factor
  next_review: string
  created_at: string
  updated_at: string
}

export interface FlashcardReview {
  id: string
  flashcard_id: string
  user_id: string
  quality: number // 0-5 rating
  reviewed_at: string
}

// API Request/Response types

export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  email: string
  password: string
  name: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface ApiError {
  error: string
  code?: string
  details?: any
}

export interface UploadResponse {
  success: boolean
  contentId?: string
  error?: string
}

export interface ChatRequest {
  workspaceId: string
  contentId: string
  message: string
  sessionId?: string
}

export interface ChatResponse {
  message: string
  sessionId: string
  references?: MessageReference[]
}

export interface QuizGenerateRequest {
  contentId: string
  difficulty: QuizDifficulty
  questionCount: number
}

export interface FlashcardGenerateRequest {
  workspaceId: string
  contentId: string
  numCards?: number
}

export interface SubscriptionInfo {
  tier: SubscriptionTier
  status: SubscriptionStatus
  trial_ends_at: string | null
  usage: {
    content_count: number
    content_limit: number
    ai_requests_today: number
    ai_requests_limit: number
  }
}
