/**
 * Subscription Management & Usage Limits
 * 
 * Handles subscription tiers, limits, and usage checking for ChatX
 */

export type SubscriptionTier = 'freemium' | 'pro' | 'enterprise'

export type SubscriptionLimits = {
  maxContent: number
  maxAIRequestsPerDay?: number
  features: {
    chat: boolean
    summaries: boolean
    quizzes: boolean
    flashcards: boolean
    unlimitedQuizzes?: boolean
    unlimitedFlashcards?: boolean
    advancedAI?: boolean
  }
}

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  freemium: {
    maxContent: 5,
    maxAIRequestsPerDay: 20, // Limited AI features
    features: {
      chat: true,
      summaries: true,
      quizzes: true, // Limited
      flashcards: true, // Limited
      unlimitedQuizzes: false,
      unlimitedFlashcards: false,
      advancedAI: false,
    },
  },
  pro: {
    maxContent: 999999, // Effectively unlimited
    features: {
      chat: true,
      summaries: true,
      quizzes: true,
      flashcards: true,
      unlimitedQuizzes: true,
      unlimitedFlashcards: true,
      advancedAI: true,
    },
  },
  enterprise: {
    maxContent: 999999, // Effectively unlimited
    features: {
      chat: true,
      summaries: true,
      quizzes: true,
      flashcards: true,
      unlimitedQuizzes: true,
      unlimitedFlashcards: true,
      advancedAI: true,
    },
  },
}

/**
 * Get subscription limits for a tier
 */
export function getSubscriptionLimits(tier: SubscriptionTier): SubscriptionLimits {
  return SUBSCRIPTION_LIMITS[tier] || SUBSCRIPTION_LIMITS.freemium
}

/**
 * Check if user can add more content
 */
export async function canAddContent(
  currentContentCount: number,
  subscriptionTier: SubscriptionTier
): Promise<{ allowed: boolean; reason?: string; limit?: number }> {
  const limits = getSubscriptionLimits(subscriptionTier)
  
  if (currentContentCount >= limits.maxContent) {
    return {
      allowed: false,
      reason: subscriptionTier === 'freemium'
        ? `You've reached the free limit of ${limits.maxContent} content items. Upgrade to Pro for unlimited content.`
        : 'Content limit reached',
      limit: limits.maxContent,
    }
  }
  
  return { allowed: true, limit: limits.maxContent }
}

/**
 * Check if feature is available for subscription tier
 */
export function hasFeatureAccess(
  subscriptionTier: SubscriptionTier,
  feature: keyof SubscriptionLimits['features']
): boolean {
  const limits = getSubscriptionLimits(subscriptionTier)
  return limits.features[feature] ?? false
}

/**
 * Get user-friendly subscription name
 */
export function getSubscriptionDisplayName(tier: SubscriptionTier): string {
  const names: Record<SubscriptionTier, string> = {
    freemium: 'Free',
    pro: 'Pro',
    enterprise: 'Enterprise',
  }
  return names[tier] || 'Free'
}

/**
 * Get subscription pricing
 */
export function getSubscriptionPricing(tier: SubscriptionTier): { monthly?: number; yearly?: number; unit: string } {
  const pricing: Record<SubscriptionTier, { monthly?: number; yearly?: number; unit: string }> = {
    freemium: { unit: 'forever' },
    pro: { monthly: 9.99, unit: 'month' },
    enterprise: { yearly: 49, unit: 'user/year' },
  }
  return pricing[tier] || pricing.freemium
}

