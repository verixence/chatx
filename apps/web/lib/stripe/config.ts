/**
 * Stripe Configuration
 * 
 * Handles Stripe initialization with graceful fallback when keys are not configured
 */

import Stripe from 'stripe'

// Check if Stripe is configured
export function isStripeConfigured(): boolean {
  return !!(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_PUBLISHABLE_KEY &&
    process.env.STRIPE_SECRET_KEY.startsWith('sk_')
  )
}

// Initialize Stripe instance (returns null if not configured)
export function getStripeInstance(): Stripe | null {
  if (!isStripeConfigured()) {
    return null
  }

  try {
    return new Stripe(process.env.STRIPE_SECRET_KEY!, {
      typescript: true,
    })
  } catch (error) {
    console.error('Error initializing Stripe:', error)
    return null
  }
}

// Get Stripe publishable key
export function getStripePublishableKey(): string | null {
  return process.env.STRIPE_PUBLISHABLE_KEY || null
}

// Stripe Price IDs for different subscription tiers
// These should be created in Stripe Dashboard and set in environment variables
export const STRIPE_PRICE_IDS = {
  pro_monthly: process.env.STRIPE_PRICE_ID_PRO_MONTHLY || 'price_pro_monthly',
  enterprise_yearly: process.env.STRIPE_PRICE_ID_ENTERPRISE_YEARLY || 'price_enterprise_yearly',
}

// Webhook secret for verifying webhook signatures
export function getStripeWebhookSecret(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET || null
}

