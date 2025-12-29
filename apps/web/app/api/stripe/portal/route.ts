import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth/middleware"
import { getUserById } from "@/lib/db/queries"
import { getStripeInstance, isStripeConfigured } from "@/lib/stripe/config"

/**
 * Create Stripe Customer Portal Session
 * POST /api/stripe/portal
 * 
 * Allows users to manage their subscription, payment methods, and invoices
 */
export async function POST(req: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { 
          error: "Payment processing is not configured. Please contact us at info@verixence.com",
          code: "STRIPE_NOT_CONFIGURED"
        },
        { status: 503 }
      )
    }

    const auth = await authenticateRequest(req)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserById(auth.userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!user.stripe_customer_id) {
      return NextResponse.json(
        { error: "No active subscription found" },
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

    // Get base URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                   'http://localhost:3000'

    // Create portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${baseUrl}/settings`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error: any) {
    console.error("Stripe portal error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create portal session" },
      { status: 500 }
    )
  }
}

