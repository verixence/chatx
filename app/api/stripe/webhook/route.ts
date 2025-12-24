import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { getStripeInstance, getStripeWebhookSecret, isStripeConfigured } from "@/lib/stripe/config"
import { getUserById, updateUserSubscription, updateUser } from "@/lib/db/queries"
import { sendPaymentFailedEmail, sendSubscriptionCancelledEmail, sendSubscriptionRenewedEmail } from "@/lib/email/notifications"
import Stripe from "stripe"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Stripe Webhook Handler
 * POST /api/stripe/webhook
 * 
 * Handles Stripe webhook events for subscription management
 */
export async function POST(req: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      console.error("Stripe webhook called but Stripe is not configured")
      return NextResponse.json(
        { error: "Webhook endpoint not configured" },
        { status: 503 }
      )
    }

    const stripe = getStripeInstance()
    const webhookSecret = getStripeWebhookSecret()

    if (!stripe || !webhookSecret) {
      return NextResponse.json(
        { error: "Webhook configuration missing" },
        { status: 500 }
      )
    }

    // Get the raw body and signature
    const body = await req.text()
    const headersList = await headers()
    const signature = headersList.get("stripe-signature")

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message)
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        // Get user ID from metadata
        const userId = session.metadata?.userId
        if (!userId) {
          console.error("No userId in checkout session metadata")
          break
        }

        // Get subscription details
        const subscriptionId = session.subscription as string
        if (!subscriptionId) {
          console.error("No subscription ID in checkout session")
          break
        }

        // Get subscription object from Stripe
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = subscription.items.data[0]?.price.id

        // Determine plan from price ID or metadata
        const planFromMetadata = session.metadata?.plan
        const planFromPrice = priceId === process.env.STRIPE_PRICE_ID_PRO_MONTHLY ? 'pro' :
                             priceId === process.env.STRIPE_PRICE_ID_ENTERPRISE_YEARLY ? 'enterprise' :
                             null
        const plan = (planFromMetadata === 'pro' || planFromMetadata === 'enterprise' ? planFromMetadata :
                     planFromPrice === 'pro' || planFromPrice === 'enterprise' ? planFromPrice :
                     'pro') as 'pro' | 'enterprise'

        // Get subscription to determine end date
        const subscriptionEndDate = (subscription as any).current_period_end 
          ? new Date((subscription as any).current_period_end * 1000).toISOString()
          : null

        // Update user subscription
        await updateUserSubscription(userId, plan, {
          subscription_status: 'active',
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscriptionId,
        })

        // Update subscription end date separately
        if (subscriptionEndDate) {
          await updateUser(userId, {
            subscription_end_date: subscriptionEndDate,
          })
        }

        console.log(`Subscription activated for user ${userId}: ${plan}`)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId

        if (!userId) {
          console.error("No userId in subscription metadata")
          break
        }

        // Determine plan from price ID
        const priceId = subscription.items.data[0]?.price.id
        const planFromPrice = priceId === process.env.STRIPE_PRICE_ID_PRO_MONTHLY ? 'pro' :
                             priceId === process.env.STRIPE_PRICE_ID_ENTERPRISE_YEARLY ? 'enterprise' :
                             null
        const plan = (planFromPrice === 'pro' || planFromPrice === 'enterprise' ? planFromPrice :
                     'pro') as 'pro' | 'enterprise'

        // Update subscription status based on Stripe status
        const status = subscription.status === 'active' ? 'active' :
                      subscription.status === 'canceled' ? 'cancelled' :
                      subscription.status === 'past_due' ? 'expired' :
                      'active'

        await updateUserSubscription(userId, plan, {
          subscription_status: status,
          stripe_subscription_id: subscription.id,
        })

        console.log(`Subscription updated for user ${userId}: ${plan} - ${status}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId

        if (!userId) {
          console.error("No userId in subscription metadata")
          break
        }

        const user = await getUserById(userId)

        // Downgrade to freemium when subscription is cancelled
        await updateUserSubscription(userId, 'freemium', {
          subscription_status: 'cancelled',
        })

        // Send cancellation email
        if (user?.email) {
          await sendSubscriptionCancelledEmail(user.email).catch((err) => {
            console.error("Failed to send cancellation email:", err)
          })
        }

        console.log(`Subscription cancelled for user ${userId}, downgraded to freemium`)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = (invoice as any).subscription
          ? (typeof (invoice as any).subscription === 'string' 
            ? (invoice as any).subscription 
            : (invoice as any).subscription?.id)
          : null
        // Subscription is active, already handled by subscription.updated
        if (subscriptionId) {
          console.log(`Payment succeeded for subscription ${subscriptionId}`)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = (invoice as any).subscription
          ? (typeof (invoice as any).subscription === 'string' 
            ? (invoice as any).subscription 
            : (invoice as any).subscription?.id)
          : null
        
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const userId = subscription.metadata?.userId

          if (userId) {
            const user = await getUserById(userId)
            if (!user) break

            // Check if this is the first failed payment (grace period)
            // Stripe typically retries failed payments, so we only mark as expired after multiple failures
            // For now, we'll implement a 7-day grace period by checking subscription status
            const subscriptionStatus = subscription.status
            
            // Determine plan from price ID
            const priceId = subscription.items.data[0]?.price.id
            const planFromPrice = priceId === process.env.STRIPE_PRICE_ID_PRO_MONTHLY ? 'pro' :
                                 priceId === process.env.STRIPE_PRICE_ID_ENTERPRISE_YEARLY ? 'enterprise' :
                                 null
            const plan = (planFromPrice === 'pro' || planFromPrice === 'enterprise' ? planFromPrice :
                         'pro') as 'pro' | 'enterprise'
            
            // Calculate grace period end date (7 days from now)
            const gracePeriodEnd = new Date()
            gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7)
            
            // If subscription is past_due, set grace period end date
            // If subscription is already canceled or unpaid for more than 7 days, mark as expired
            if (subscriptionStatus === 'past_due') {
              // Check if user already has a grace period
              const currentEndDate = user.subscription_end_date 
                ? new Date(user.subscription_end_date) 
                : null
              
              // Only set grace period if not already set or expired
              if (!currentEndDate || currentEndDate < new Date()) {
                await updateUser(userId, {
                  subscription_end_date: gracePeriodEnd.toISOString(),
                })
                console.log(`Payment failed for user ${userId}, grace period set until ${gracePeriodEnd.toISOString()}`)
              }
            } else if (subscriptionStatus === 'unpaid' || subscriptionStatus === 'canceled') {
              // Subscription has been unpaid for a while or canceled, mark as expired
              await updateUserSubscription(userId, plan, {
                subscription_status: 'expired',
                stripe_subscription_id: subscriptionId,
              })
              
              // Send payment failed email
              if (user.email) {
                await sendPaymentFailedEmail(user.email, 7).catch((err) => {
                  console.error("Failed to send payment failed email:", err)
                })
              }
              
              console.log(`Payment failed for user ${userId}, subscription marked as expired (status: ${subscriptionStatus})`)
            }
          }
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("Webhook error:", error)
    return NextResponse.json(
      { error: error.message || "Webhook handler failed" },
      { status: 500 }
    )
  }
}

