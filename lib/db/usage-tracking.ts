/**
 * Usage Tracking Functions
 * 
 * Handles daily usage tracking for subscription limits
 */

import { supabaseAdmin } from './supabase'

export interface UsageTracking {
  id: string
  user_id: string
  date: string
  ai_requests_count: number
  quiz_generations_count: number
  flashcard_generations_count: number
  created_at: string
  updated_at: string
}

/**
 * Get or create usage tracking for today
 */
export async function getOrCreateUsageTracking(userId: string, date?: Date): Promise<UsageTracking | null> {
  const trackingDate = date || new Date()
  const dateString = trackingDate.toISOString().split('T')[0] // YYYY-MM-DD format

  try {
    // Try to get existing record
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('usage_tracking')
      .select('*')
      .eq('user_id', userId)
      .eq('date', dateString)
      .maybeSingle()

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching usage tracking:', fetchError)
      return null
    }

    if (existing) {
      return existing as UsageTracking
    }

    // Create new record
    const { data: newRecord, error: insertError } = await supabaseAdmin
      .from('usage_tracking')
      .insert({
        user_id: userId,
        date: dateString,
        ai_requests_count: 0,
        quiz_generations_count: 0,
        flashcard_generations_count: 0,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating usage tracking:', insertError)
      return null
    }

    return newRecord as UsageTracking
  } catch (error) {
    console.error('Exception in getOrCreateUsageTracking:', error)
    return null
  }
}

/**
 * Increment AI request count for today
 */
export async function incrementAIRequestCount(userId: string): Promise<number> {
  try {
    // Ensure usage tracking exists for today
    await getOrCreateUsageTracking(userId)

    const today = new Date().toISOString().split('T')[0]

    // Get current count
    const { data: current, error: fetchError } = await supabaseAdmin
      .from('usage_tracking')
      .select('ai_requests_count')
      .eq('user_id', userId)
      .eq('date', today)
      .single()

    if (fetchError) {
      console.error('Error fetching current count:', fetchError)
      return 0
    }

    const newCount = (current?.ai_requests_count || 0) + 1

    // Update count
    const { error: updateError } = await supabaseAdmin
      .from('usage_tracking')
      .update({
        ai_requests_count: newCount,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('date', today)

    if (updateError) {
      console.error('Error incrementing AI request count:', updateError)
      return current?.ai_requests_count || 0
    }

    return newCount
  } catch (error) {
    console.error('Exception in incrementAIRequestCount:', error)
    return 0
  }
}

/**
 * Get today's AI request count
 */
export async function getTodayAIRequestCount(userId: string): Promise<number> {
  try {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabaseAdmin
      .from('usage_tracking')
      .select('ai_requests_count')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching today AI request count:', error)
      return 0
    }

    return data?.ai_requests_count || 0
  } catch (error) {
    console.error('Exception in getTodayAIRequestCount:', error)
    return 0
  }
}

/**
 * Check if user can make AI request (respects daily limit)
 */
export async function canMakeAIRequest(
  userId: string,
  subscriptionTier: 'freemium' | 'pro' | 'enterprise',
  dailyLimit?: number
): Promise<{ allowed: boolean; current: number; limit: number; reason?: string }> {
  // Pro and Enterprise have unlimited requests
  if (subscriptionTier === 'pro' || subscriptionTier === 'enterprise') {
    return { allowed: true, current: 0, limit: Infinity }
  }

  // Freemium has daily limit
  const limit = dailyLimit || 20 // Default to 20 if not specified
  const current = await getTodayAIRequestCount(userId)

  if (current >= limit) {
    return {
      allowed: false,
      current,
      limit,
      reason: `You've reached your daily limit of ${limit} AI requests. Upgrade to Pro for unlimited requests.`,
    }
  }

  return { allowed: true, current, limit }
}

