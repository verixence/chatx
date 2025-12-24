import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { getUserById } from "@/lib/db/queries"
import { getStripeInstance, getStripePublishableKey, isStripeConfigured, STRIPE_PRICE_IDS } from "@/lib/stripe/config"

/**
 * Create Stripe Checkout Session
 * POST /api/stripe/checkout
 * 
 * Query params:
 * - plan: 'pro' | 'enterprise'
 * - success_url: Optional redirect URL after successful payment
 * - cancel_url: Optional redirect URL after cancelled payment
 */
export async function POST(req: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { 
          error: "Payment processing is not configured. Please contact us at info@verixence.com",
          code: "STRIPE_NOT_CONFIGURED"
        },
        { status: 503 }
      )
    }

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const plan = searchParams.get("plan") as 'pro' | 'enterprise' | null

    if (!plan || !['pro', 'enterprise'].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan. Must be 'pro' or 'enterprise'" },
        { status: 400 }
      )
    }

    const user = await getUserById(session.user.id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const stripe = getStripeInstance()
    if (!stripe) {
      return NextResponse.json(
        { error: "Payment service unavailable" },
        { status: 503 }
      )
    }

    // Get base URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                   'http://localhost:3000'

    // Determine price ID based on plan
    const priceId = plan === 'pro' 
      ? STRIPE_PRICE_IDS.pro_monthly
      : STRIPE_PRICE_IDS.enterprise_yearly

    // Create or get Stripe customer
    let customerId = user.stripe_customer_id || null

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      })
      customerId = customer.id

      // Update user with Stripe customer ID (will be updated via webhook after subscription)
      // For now, we'll just use it in the checkout session
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: plan === 'pro' ? 'subscription' : 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/settings?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/settings?canceled=true`,
      metadata: {
        userId: user.id,
        plan: plan,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          plan: plan,
        },
      },
    })

    return NextResponse.json({ 
      sessionId: checkoutSession.id,
      url: checkoutSession.url 
    })
  } catch (error: any) {
    console.error("Stripe checkout error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    )
  }
}

/**
 * Get checkout session status
 * GET /api/stripe/checkout?session_id=xxx
 */
export async function GET(req: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Payment processing is not configured" },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get("session_id")

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      )
    }

    const stripe = getStripeInstance()
    if (!stripe) {
      return NextResponse.json(
        { error: "Payment service unavailable" },
        { status: 503 }
      )
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId)

    return NextResponse.json({
      session: {
        id: session.id,
        status: session.status,
        payment_status: session.payment_status,
        customer: session.customer,
        subscription: session.subscription,
      },
    })
  } catch (error: any) {
    console.error("Stripe checkout retrieval error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to retrieve checkout session" },
      { status: 500 }
    )
  }
}

