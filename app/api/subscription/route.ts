import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { getUserById, getUserContentCount, updateUserSubscription, updateUser } from "@/lib/db/queries"
import { 
  getSubscriptionLimits, 
  getSubscriptionPricing, 
  getSubscriptionDisplayName,
  isTrialActive,
  isTrialExpired,
  getTrialDaysRemaining,
  type SubscriptionTier 
} from "@/lib/subscriptions/subscription"
import { sendTrialExpiredEmail } from "@/lib/email/notifications"

// GET - Get current subscription info and usage
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserById(session.user.id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const subscriptionTier = user.subscription as SubscriptionTier
    const limits = getSubscriptionLimits(subscriptionTier)
    const pricing = getSubscriptionPricing(subscriptionTier)
    const displayName = getSubscriptionDisplayName(subscriptionTier)
    
    // Get subscription status - trial users stay in trial status even after expiration
    // They need to upgrade to continue using the service
    const subscriptionStatus = user.subscription_status || 'active'
    
    // Get actual content count
    const contentCount = await getUserContentCount(session.user.id)
    
    // Trial information
    const trialActive = isTrialActive(subscriptionStatus, user.subscription_end_date)
    const trialExpired = isTrialExpired(subscriptionStatus, user.subscription_end_date)
    const trialDaysRemaining = getTrialDaysRemaining(user.subscription_end_date)

    // Note: Trial expired email is handled in the webhook/system, not here
    // to avoid sending duplicate emails on every API call

    return NextResponse.json({
      subscription: subscriptionTier,
      displayName,
      limits,
      pricing,
      usage: {
        content: {
          current: contentCount,
          limit: limits.maxContent,
          percentage: limits.maxContent === 999999 ? 0 : Math.round((contentCount / limits.maxContent) * 100),
        },
      },
      status: subscriptionStatus,
      startDate: user.subscription_start_date,
      endDate: user.subscription_end_date,
      stripeCustomerId: user.stripe_customer_id,
      stripeSubscriptionId: user.stripe_subscription_id,
      trial: {
        isActive: trialActive,
        isExpired: isTrialExpired(subscriptionStatus, user.subscription_end_date),
        daysRemaining: trialDaysRemaining,
      },
    })
  } catch (error: any) {
    console.error("Subscription info error:", error)
    return NextResponse.json(
      { error: "Failed to fetch subscription info" },
      { status: 500 }
    )
  }
}

// POST - Update subscription (upgrade/downgrade)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { subscription, subscription_status } = await req.json()

    if (!subscription || !['freemium', 'pro', 'enterprise'].includes(subscription)) {
      return NextResponse.json(
        { error: "Invalid subscription tier" },
        { status: 400 }
      )
    }

    const user = await getUserById(session.user.id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Prevent direct subscription updates for paid plans (must go through Stripe)
    if ((subscription === 'pro' || subscription === 'enterprise') && !user.stripe_subscription_id) {
      return NextResponse.json(
        { error: "Paid subscriptions must be purchased through Stripe checkout. Please use the upgrade button in settings." },
        { status: 400 }
      )
    }

    // Handle downgrade from paid plan to freemium
    if (subscription === 'freemium' && (user.subscription === 'pro' || user.subscription === 'enterprise')) {
      // Get current content count
      const currentContentCount = await getUserContentCount(session.user.id)
      const freemiumLimit = 5

      // Policy: Keep all existing content but user won't be able to add more if over limit
      // Content is not deleted, but creation of new content will be blocked
      // This allows users to keep their work while encouraging upgrade
      if (currentContentCount > freemiumLimit) {
        // Allow downgrade but warn user
        console.log(`User ${session.user.id} downgrading from ${user.subscription} to freemium with ${currentContentCount} content items (limit: ${freemiumLimit})`)
      }
    }

    const updatedUser = await updateUserSubscription(
      session.user.id,
      subscription as SubscriptionTier,
      {
        subscription_status: subscription_status || 'active',
      }
    )

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Failed to update subscription" },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      subscription: updatedUser.subscription 
    })
  } catch (error: any) {
    console.error("Subscription update error:", error)
    return NextResponse.json(
      { error: "Failed to update subscription" },
      { status: 500 }
    )
  }
}

