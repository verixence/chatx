import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Helper to check if we're in a build/static generation context
// During build, Next.js may not have access to env vars, so we create a placeholder client
const isBuildContext = process.env.NEXT_PHASE === 'phase-production-build' || 
                       process.env.NEXT_PHASE === 'phase-development-build' ||
                       !process.env.SUPABASE_URL

// Server-side client with service role key (for admin operations)
// During build, create a placeholder client that will be replaced at runtime
export const supabaseAdmin = (supabaseUrl && supabaseServiceKey && !isBuildContext)
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : createClient(
      supabaseUrl || 'https://placeholder.supabase.co', 
      supabaseServiceKey || 'placeholder-key',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    ) // Placeholder during build - actual client will be used at runtime

// Client-side client (for user operations)
export function createSupabaseClient(accessToken?: string) {
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY!
  
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false
    }
  })

  if (accessToken) {
    client.auth.setSession({
      access_token: accessToken,
      refresh_token: ''
    } as any)
  }

  return client
}

// Database type definitions
export interface User {
  id: string
  email: string
  password?: string | null
  name?: string | null
  image?: string | null
  subscription: 'freemium' | 'pro' | 'enterprise'
  usage_limits: {
    uploadsToday: number
    uploadsLimit: number
    lastReset: string | null
  }
  ai_provider: 'groq' | 'openai'
  subscription_status?: 'active' | 'cancelled' | 'expired' | 'trial' | null
  subscription_start_date?: string | null
  subscription_end_date?: string | null
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
  content_count?: number | null
  created_at: string
  updated_at: string
}

export interface Workspace {
  id: string
  user_id: string
  name: string
  description?: string | null
  tags: string[]
  shared: boolean
  share_token?: string | null
  created_at: string
  updated_at: string
}

export interface Content {
  id: string
  workspace_id: string
  type: 'pdf' | 'youtube' | 'audio' | 'video' | 'text'
  raw_url?: string | null
  extracted_text?: string | null
  metadata?: any
  title?: string | null
  status: 'processing' | 'complete' | 'error' | 'ready' | 'partial'
  file_size?: number | null
  created_at: string
  updated_at: string
}

export interface ProcessedContent {
  id: string
  content_id: string
  chunks: any[]
  embeddings?: any
  summary?: string | null
  transcript?: string | null
  graph_json?: any
  created_at: string
  updated_at: string
}

export interface ChatSession {
  id: string
  workspace_id: string
  user_id: string
  content_id?: string | null
  messages: any[]
  created_at: string
  updated_at: string
}

export interface Quiz {
  id: string
  workspace_id: string
  content_id?: string | null
  questions: any[]
  difficulty: 'easy' | 'medium' | 'hard'
  created_at: string
  updated_at: string
}

export interface QuizAttempt {
  id: string
  quiz_id: string
  user_id: string
  answers: any[]
  score: number
  completed_at: string
}

export interface Flashcard {
  id: string
  workspace_id: string
  content_id?: string | null
  question: string
  answer: string
  difficulty: number
  next_review: string
  created_at: string
  updated_at: string
}

export interface FlashcardReview {
  id: string
  flashcard_id: string
  user_id: string
  result: 'correct' | 'incorrect'
  reviewed_at: string
}

export interface UserProgress {
  id: string
  user_id: string
  workspace_id: string
  mastery_map: any
  streaks: number
  total_time: number
  last_active: string
  created_at: string
  updated_at: string
}

