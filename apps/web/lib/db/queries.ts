import { supabaseAdmin, type User, type Workspace, type Content, type ProcessedContent, type ChatSession, type Quiz, type QuizAttempt, type Flashcard, type FlashcardReview, type UserProgress } from './supabase'
import bcrypt from 'bcryptjs'

// User queries
export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  
  if (error) {
    console.error('Error fetching user:', error)
    return null
  }
  return data as User | null
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle()
  
  if (error) {
    console.error('Error fetching user:', error)
    return null
  }
  return data as User | null
}

export async function createUser(userData: {
  email: string
  name?: string
  image?: string
  subscription?: 'freemium' | 'pro' | 'enterprise'
  ai_provider?: 'groq' | 'openai'
  password_hash?: string
}): Promise<User | null> {
  try {
    const now = new Date()
    const subscription = userData.subscription || 'freemium'
    
    // For freemium users, set up 14-day free trial
    const isFreemium = subscription === 'freemium'
    const trialEndDate = isFreemium 
      ? new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
      : null

    const insertData: any = {
      email: userData.email,
      subscription,
      ai_provider: userData.ai_provider || 'openai',
      usage_limits: { 
        uploadsToday: 0, 
        uploadsLimit: 3, 
        lastReset: now.toISOString()
      },
      subscription_status: isFreemium ? 'trial' : 'active',
      subscription_start_date: now.toISOString(),
      subscription_end_date: trialEndDate?.toISOString() || null,
      content_count: 0,
    }
    
    if (userData.name) insertData.name = userData.name
    if (userData.image) insertData.image = userData.image
    if (userData.password_hash) insertData.password_hash = userData.password_hash
    
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert(insertData)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating user:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      console.error('Error details:', error.details)
      console.error('Error hint:', error.hint)
      console.error('Full error object:', JSON.stringify(error, null, 2))
      return null
    }
    return data as User
  } catch (err: any) {
    console.error('Exception creating user:', err)
    console.error('Exception message:', err?.message)
    return null
  }
}

// Password utility functions
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10
  return await bcrypt.hash(password, saltRounds)
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return await bcrypt.compare(password, passwordHash)
}

// Get user with password hash (for authentication only - use with caution)
export async function getUserWithPasswordByEmail(email: string): Promise<(User & { password_hash: string | null }) | null> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*, password_hash')
    .eq('email', email)
    .maybeSingle()
  
  if (error) {
    console.error('Error fetching user with password:', error)
    return null
  }
  return data as (User & { password_hash: string | null }) | null
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating user:', error)
    return null
  }
  return data as User
}

// Subscription management functions
export async function updateUserSubscription(
  userId: string, 
  subscription: 'freemium' | 'pro' | 'enterprise',
  options?: {
    subscription_status?: 'active' | 'cancelled' | 'expired' | 'trial'
    stripe_customer_id?: string
    stripe_subscription_id?: string
  }
): Promise<User | null> {
  const now = new Date().toISOString()
  const updates: Partial<User> = {
    subscription,
    subscription_status: options?.subscription_status || 'active',
    subscription_start_date: now,
    updated_at: now,
  }

  if (options?.stripe_customer_id) {
    updates.stripe_customer_id = options.stripe_customer_id
  }
  if (options?.stripe_subscription_id) {
    updates.stripe_subscription_id = options.stripe_subscription_id
  }

  // Update subscription history
  const { error: historyError } = await supabaseAdmin
    .from('subscription_history')
    .insert({
      user_id: userId,
      subscription_type: subscription,
      status: options?.subscription_status || 'active',
      started_at: now,
      stripe_subscription_id: options?.stripe_subscription_id || null,
    })

  if (historyError) {
    console.error('Error updating subscription history:', historyError)
    // Continue even if history update fails
  }

  return updateUser(userId, updates)
}

export async function getSubscriptionHistory(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('subscription_history')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error fetching subscription history:', error)
    return []
  }
  return data || []
}

// Workspace queries
export async function getWorkspacesByUserId(userId: string): Promise<Workspace[]> {
  const { data, error } = await supabaseAdmin
    .from('workspaces')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching workspaces:', error)
    return []
  }
  return data as Workspace[]
}

export async function getWorkspaceById(id: string): Promise<Workspace | null> {
  const { data, error } = await supabaseAdmin
    .from('workspaces')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching workspace:', error)
    return null
  }
  return data as Workspace
}

export async function createWorkspace(workspaceData: {
  user_id: string
  name: string
  description?: string
  tags?: string[]
}): Promise<Workspace | null> {
  const { data, error } = await supabaseAdmin
    .from('workspaces')
    .insert(workspaceData)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating workspace:', error)
    return null
  }
  return data as Workspace
}

export async function updateWorkspace(id: string, updates: Partial<Workspace>): Promise<Workspace | null> {
  const { data, error } = await supabaseAdmin
    .from('workspaces')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating workspace:', error)
    return null
  }
  return data as Workspace
}

export async function deleteWorkspace(id: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('workspaces')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting workspace:', error)
    return false
  }
  return true
}

// Content queries
export async function getContentsByWorkspaceId(workspaceId: string): Promise<Content[]> {
  const { data, error } = await supabaseAdmin
    .from('contents')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching contents:', error)
    return []
  }
  return data as Content[]
}

export async function getYoutubeContentsByRawUrl(rawUrl: string): Promise<Content[]> {
  const { data, error } = await supabaseAdmin
    .from('contents')
    .select('*')
    .eq('type', 'youtube')
    .eq('raw_url', rawUrl)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching youtube contents by URL:', error)
    return []
  }
  return data as Content[]
}

export async function getContentById(id: string): Promise<Content | null> {
  const { data, error } = await supabaseAdmin
    .from('contents')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching content:', error)
    return null
  }
  return data as Content
}

/**
 * Get total content count for a user across all their workspaces
 */
export async function getUserContentCount(userId: string): Promise<number> {
  // Get all workspace IDs for the user
  const { data: workspaces, error: workspacesError } = await supabaseAdmin
    .from('workspaces')
    .select('id')
    .eq('user_id', userId)
  
  if (workspacesError || !workspaces || workspaces.length === 0) {
    return 0
  }
  
  const workspaceIds = workspaces.map(w => w.id)
  
  const { count, error } = await supabaseAdmin
    .from('contents')
    .select('*', { count: 'exact', head: true })
    .in('workspace_id', workspaceIds)
  
  if (error) {
    console.error('Error counting user content:', error)
    return 0
  }
  return count || 0
}

export async function createContent(contentData: {
  workspace_id: string
  type: 'pdf' | 'youtube' | 'audio' | 'video' | 'text'
  raw_url?: string
  extracted_text?: string
  metadata?: any
  title?: string | null
  status?: 'processing' | 'complete' | 'error' | 'ready' | 'partial'
  file_size?: number
}): Promise<Content | null> {
  const { data, error } = await supabaseAdmin
    .from('contents')
    .insert({
      ...contentData,
      status: contentData.status || 'processing'
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating content:', error)
    return null
  }
  return data as Content
}

export async function updateContent(id: string, updates: Partial<Content>): Promise<Content | null> {
  const { data, error } = await supabaseAdmin
    .from('contents')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating content:', error)
    return null
  }
  return data as Content
}

export async function deleteContent(id: string): Promise<boolean> {
  // First delete processed content (foreign key constraint)
  await supabaseAdmin
    .from('processed_contents')
    .delete()
    .eq('content_id', id)
  
  // Delete chat sessions related to this content
  await supabaseAdmin
    .from('chat_sessions')
    .delete()
    .eq('content_id', id)
  
  // Delete the content itself
  const { error } = await supabaseAdmin
    .from('contents')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting content:', error)
    return false
  }
  return true
}

// ProcessedContent queries
export async function getProcessedContentByContentId(contentId: string): Promise<ProcessedContent | null> {
  const { data, error } = await supabaseAdmin
    .from('processed_contents')
    .select('*')
    .eq('content_id', contentId)
    .single()
  
  if (error) {
    console.error('Error fetching processed content:', error)
    return null
  }
  return data as ProcessedContent
}

export async function createProcessedContent(processedData: {
  content_id: string
  chunks: any[]
  embeddings?: any
  summary?: string
  transcript?: string
  graph_json?: any
}): Promise<ProcessedContent | null> {
  const { data, error } = await supabaseAdmin
    .from('processed_contents')
    .insert(processedData)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating processed content:', error)
    return null
  }
  return data as ProcessedContent
}

export async function updateProcessedContent(id: string, updates: Partial<ProcessedContent>): Promise<ProcessedContent | null> {
  const { data, error } = await supabaseAdmin
    .from('processed_contents')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating processed content:', error)
    return null
  }
  return data as ProcessedContent
}

// ChatSession queries
export async function getChatSessionByContentId(contentId: string): Promise<ChatSession | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('chat_sessions')
      .select('*')
      .eq('content_id', contentId)
      .maybeSingle()
    
    if (error) {
      // If column doesn't exist, return null (migration not run yet)
      if (error.code === '42703' || error.message?.includes('content_id')) {
        console.warn('content_id column not found - migration may not be run yet')
        return null
      }
      console.error('Error fetching chat session by content_id:', error)
      return null
    }
    return data as ChatSession | null
  } catch (err: any) {
    console.error('Error in getChatSessionByContentId:', err)
    return null
  }
}

export async function getOrCreateChatSessionByContentId(contentId: string, workspaceId: string, userId: string): Promise<ChatSession> {
  // Try to get existing session
  let session = await getChatSessionByContentId(contentId)
  
  if (session) {
    // Runtime check: verify content_id matches (if column exists)
    if (session.content_id && session.content_id !== contentId) {
      throw new Error(`Chat session content_id mismatch: expected ${contentId}, got ${session.content_id}`)
    }
    return session
  }
  
  // Try to create new session with content_id
  try {
    const { data, error } = await supabaseAdmin
      .from('chat_sessions')
      .insert({
        content_id: contentId,
        workspace_id: workspaceId,
        user_id: userId,
        messages: []
      })
      .select()
      .single()
    
    if (error) throw error
    return data as ChatSession
  } catch (err: any) {
    // If insert fails due to missing column, use fallback
    if (err?.code === '42703' || err?.code === 'PGRST204' || err?.message?.includes('content_id')) {
      console.warn('Using fallback session creation - migration not run yet')
      const fallbackSession = await supabaseAdmin
        .from('chat_sessions')
        .insert({
          workspace_id: workspaceId,
          user_id: userId,
          messages: [{ _contentId: contentId, _type: 'metadata' }]
        })
        .select()
        .single()
      
      if (fallbackSession.error) {
        throw new Error(`Failed to create chat session: ${fallbackSession.error.message}`)
      }
      
      return { ...fallbackSession.data, content_id: contentId } as ChatSession
    }
    throw err
  }
}

export async function getChatMessages(chatSessionId: string): Promise<any[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('chat_messages')
      .select('*')
      .eq('chat_session_id', chatSessionId)
      .order('created_at', { ascending: true })
    
    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === '42P01' || error.code === 'PGRST204') {
        console.warn('chat_messages table not found, using session.messages fallback')
        return []
      }
      console.error('Error fetching chat messages:', error)
      return []
    }
    return data || []
  } catch (err: any) {
    console.warn('Error in getChatMessages:', err)
    return []
  }
}

export async function addChatMessage(chatSessionId: string, role: 'user' | 'assistant' | 'system', message: string, references?: any[]): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('chat_messages')
      .insert({
        chat_session_id: chatSessionId,
        role,
        message,
        message_references: references || null
      })
    
    if (error) {
      // If table doesn't exist, silently fail (will use session.messages fallback)
      if (error.code === '42P01' || error.code === 'PGRST204') {
        console.warn('chat_messages table not found, using session.messages fallback')
        return
      }
      console.error('Error adding chat message:', error)
    }
  } catch (err: any) {
    console.warn('Error in addChatMessage:', err)
  }
}

export async function getChatSessionsByWorkspaceId(workspaceId: string, userId: string): Promise<ChatSession[]> {
  const { data, error } = await supabaseAdmin
    .from('chat_sessions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .is('content_id', null) // Only workspace-level chats
    .order('updated_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching chat sessions:', error)
    return []
  }
  return data as ChatSession[]
}

export async function getChatSessionById(id: string): Promise<ChatSession | null> {
  const { data, error } = await supabaseAdmin
    .from('chat_sessions')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching chat session:', error)
    return null
  }
  return data as ChatSession
}

export async function createChatSession(sessionData: {
  workspace_id: string
  user_id: string
  content_id?: string | null
  messages?: any[]
}): Promise<ChatSession | null> {
  const { data, error } = await supabaseAdmin
    .from('chat_sessions')
    .insert({
      ...sessionData,
      messages: sessionData.messages || []
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating chat session:', error)
    return null
  }
  return data as ChatSession
}

export async function updateChatSession(id: string, updates: Partial<ChatSession>): Promise<ChatSession | null> {
  const { data, error } = await supabaseAdmin
    .from('chat_sessions')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating chat session:', error)
    return null
  }
  return data as ChatSession
}

// Quiz queries
export async function getQuizById(id: string): Promise<Quiz | null> {
  const { data, error } = await supabaseAdmin
    .from('quizzes')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching quiz:', error)
    return null
  }
  return data as Quiz
}

export async function getQuizzesByWorkspaceId(workspaceId: string): Promise<Quiz[]> {
  const { data, error } = await supabaseAdmin
    .from('quizzes')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching quizzes:', error)
    return []
  }
  return data as Quiz[]
}

export async function getQuizzesByContentId(contentId: string): Promise<Quiz[]> {
  const { data, error } = await supabaseAdmin
    .from('quizzes')
    .select('*')
    .eq('content_id', contentId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching quizzes by content:', error)
    return []
  }
  return data as Quiz[]
}

export async function createQuiz(quizData: {
  workspace_id: string
  content_id?: string
  questions: any[]
  difficulty?: 'easy' | 'medium' | 'hard'
}): Promise<Quiz | null> {
  const { data, error } = await supabaseAdmin
    .from('quizzes')
    .insert({
      ...quizData,
      difficulty: quizData.difficulty || 'medium'
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating quiz:', error)
    return null
  }
  return data as Quiz
}

export async function getQuizAttemptsByQuizId(quizId: string, userId: string): Promise<QuizAttempt[]> {
  const { data, error } = await supabaseAdmin
    .from('quiz_attempts')
    .select('*')
    .eq('quiz_id', quizId)
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(5)
  
  if (error) {
    console.error('Error fetching quiz attempts:', error)
    return []
  }
  return data as QuizAttempt[]
}

export async function createQuizAttempt(attemptData: {
  quiz_id: string
  user_id: string
  answers: any[]
  score: number
}): Promise<QuizAttempt | null> {
  const { data, error } = await supabaseAdmin
    .from('quiz_attempts')
    .insert(attemptData)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating quiz attempt:', error)
    return null
  }
  return data as QuizAttempt
}

// Flashcard queries
export async function getFlashcardById(id: string): Promise<Flashcard | null> {
  const { data, error } = await supabaseAdmin
    .from('flashcards')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching flashcard:', error)
    return null
  }
  return data as Flashcard
}

export async function getFlashcardsByWorkspaceId(workspaceId: string): Promise<Flashcard[]> {
  const { data, error } = await supabaseAdmin
    .from('flashcards')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('next_review', { ascending: true })

  if (error) {
    console.error('Error fetching flashcards:', error)
    return []
  }
  return data as Flashcard[]
}

export async function getFlashcardsByContentId(contentId: string): Promise<Flashcard[]> {
  const { data, error } = await supabaseAdmin
    .from('flashcards')
    .select('*')
    .eq('content_id', contentId)
    .order('next_review', { ascending: true })

  if (error) {
    console.error('Error fetching flashcards by content:', error)
    return []
  }
  return data as Flashcard[]
}

export async function createFlashcard(flashcardData: {
  workspace_id: string
  content_id?: string
  question: string
  answer: string
  difficulty?: number
}): Promise<Flashcard | null> {
  const { data, error } = await supabaseAdmin
    .from('flashcards')
    .insert({
      ...flashcardData,
      difficulty: flashcardData.difficulty || 2.5
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating flashcard:', error)
    return null
  }
  return data as Flashcard
}

export async function updateFlashcard(id: string, updates: Partial<Flashcard>): Promise<Flashcard | null> {
  const { data, error } = await supabaseAdmin
    .from('flashcards')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating flashcard:', error)
    return null
  }
  return data as Flashcard
}

export async function createFlashcardReview(reviewData: {
  flashcard_id: string
  user_id: string
  result: 'correct' | 'incorrect'
}): Promise<FlashcardReview | null> {
  const { data, error } = await supabaseAdmin
    .from('flashcard_reviews')
    .insert(reviewData)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating flashcard review:', error)
    return null
  }
  return data as FlashcardReview
}

// UserProgress queries
export async function getUserProgress(userId: string, workspaceId: string): Promise<UserProgress | null> {
  const { data, error } = await supabaseAdmin
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId)
    .single()
  
  if (error) {
    // If not found, create a new one
    return await upsertUserProgress({
      user_id: userId,
      workspace_id: workspaceId
    })
  }
  return data as UserProgress
}

export async function upsertUserProgress(progressData: {
  user_id: string
  workspace_id: string
  mastery_map?: any
  streaks?: number
  total_time?: number
}): Promise<UserProgress | null> {
  const { data, error } = await supabaseAdmin
    .from('user_progress')
    .upsert({
      ...progressData,
      mastery_map: progressData.mastery_map || {},
      streaks: progressData.streaks || 0,
      total_time: progressData.total_time || 0,
      last_active: new Date().toISOString()
    }, {
      onConflict: 'user_id,workspace_id'
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error upserting user progress:', error)
    return null
  }
  return data as UserProgress
}


// Update user password
export async function updateUserPassword(userId: string, hashedPassword: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('users')
    .update({ password: hashedPassword })
    .eq('id', userId)
  
  if (error) {
    console.error('Error updating password:', error)
    return false
  }
  return true
}

// Delete user and all associated data
export async function deleteUser(userId: string): Promise<boolean> {
  try {
    // Delete in order (respecting foreign key constraints)
    
    // 1. Delete user progress
    await supabaseAdmin.from('user_progress').delete().eq('user_id', userId)
    
    // 2. Delete flashcard attempts
    await supabaseAdmin.from('flashcard_attempts').delete().eq('user_id', userId)
    
    // 3. Delete quiz attempts
    await supabaseAdmin.from('quiz_attempts').delete().eq('user_id', userId)
    
    // 4. Delete chat messages (for user's workspaces)
    const { data: workspaces } = await supabaseAdmin
      .from('workspaces')
      .select('id')
      .eq('user_id', userId)
    
    if (workspaces) {
      for (const workspace of workspaces) {
        await supabaseAdmin.from('chat_messages').delete().eq('workspace_id', workspace.id)
      }
    }
    
    // 5. Delete flashcards (for user's workspaces)
    if (workspaces) {
      for (const workspace of workspaces) {
        await supabaseAdmin.from('flashcards').delete().eq('workspace_id', workspace.id)
      }
    }
    
    // 6. Delete quizzes (for user's workspaces)
    if (workspaces) {
      for (const workspace of workspaces) {
        await supabaseAdmin.from('quizzes').delete().eq('workspace_id', workspace.id)
      }
    }
    
    // 7. Delete processed content (for user's content)
    const { data: contents } = await supabaseAdmin
      .from('contents')
      .select('id')
      .eq('user_id', userId)
    
    if (contents) {
      for (const content of contents) {
        await supabaseAdmin.from('processed_content').delete().eq('content_id', content.id)
      }
    }
    
    // 8. Delete contents
    await supabaseAdmin.from('contents').delete().eq('user_id', userId)
    
    // 9. Delete workspaces
    await supabaseAdmin.from('workspaces').delete().eq('user_id', userId)
    
    // 10. Finally, delete the user
    const { error } = await supabaseAdmin.from('users').delete().eq('id', userId)
    
    if (error) {
      console.error('Error deleting user:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error in deleteUser:', error)
    return false
  }
}
