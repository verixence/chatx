"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Check, Crown, Zap, Building2, ArrowUp, AlertCircle, Clock, Mail } from "lucide-react"
import { getSubscriptionPricing, getSubscriptionDisplayName, type SubscriptionTier } from "@/lib/subscriptions/subscription"
import Link from "next/link"

interface SubscriptionInfo {
  subscription: SubscriptionTier
  displayName: string
  limits: {
    maxContent: number
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
  pricing: {
    monthly?: number
    yearly?: number
    unit: string
  }
  usage: {
    content: {
      current: number
      limit: number
      percentage: number
    }
  }
  status: string
  startDate?: string
  endDate?: string
  stripeCustomerId?: string | null
  stripeSubscriptionId?: string | null
  trial?: {
    isActive: boolean
    isExpired: boolean
    daysRemaining: number | null
  }
}

interface SubscriptionManagementProps {
  user: any
  upgradePlan?: string // Optional upgrade plan from URL params
}

export default function SubscriptionManagement({ user, upgradePlan }: SubscriptionManagementProps) {
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)
  const [showStripeDialog, setShowStripeDialog] = useState(false)
  const [stripeDialogMessage, setStripeDialogMessage] = useState("")
  const [stripeDialogTitle, setStripeDialogTitle] = useState("Payment Processing Not Available")
  const [isStripeError, setIsStripeError] = useState(true)
  const subscriptionSectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchSubscriptionInfo()
  }, [])

  // Handle upgrade plan parameter - scroll to subscription section and highlight upgrade
  useEffect(() => {
    if (upgradePlan && (upgradePlan === 'pro' || upgradePlan === 'enterprise') && subscriptionSectionRef.current) {
      // Scroll to subscription section
      setTimeout(() => {
        subscriptionSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        // Highlight the upgrade button after a short delay
        setTimeout(() => {
          const upgradeButton = subscriptionSectionRef.current?.querySelector(
            upgradePlan === 'pro' 
              ? '[data-upgrade-plan="pro"]' 
              : '[data-upgrade-plan="enterprise"]'
          ) as HTMLElement
          if (upgradeButton) {
            upgradeButton.classList.add('ring-4', 'ring-yellow-400', 'ring-opacity-75')
            setTimeout(() => {
              upgradeButton.classList.remove('ring-4', 'ring-yellow-400', 'ring-opacity-75')
            }, 3000)
          }
        }, 500)
      }, 300)
      // Clean up URL parameter
      window.history.replaceState({}, '', '/settings')
    }
  }, [upgradePlan])

  // Send email notification when trial is ending soon (3 days before)
  useEffect(() => {
    if (subscriptionInfo?.trial?.isActive && subscriptionInfo.trial.daysRemaining !== null) {
      if (subscriptionInfo.trial.daysRemaining === 3) {
        // Send trial ending soon email (only once when it hits 3 days)
        fetch('/api/subscription/notify-trial-ending', {
          method: 'POST',
        }).catch(console.error)
      }
    }
  }, [subscriptionInfo?.trial?.daysRemaining])

  const fetchSubscriptionInfo = async () => {
    try {
      const response = await fetch("/api/subscription")
      if (response.ok) {
        const data = await response.json()
        setSubscriptionInfo(data)
      }
    } catch (error) {
      console.error("Error fetching subscription info:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (newTier: SubscriptionTier) => {
    setUpgrading(true)
    try {
      if (newTier === 'pro' || newTier === 'enterprise') {
        // Redirect to Stripe checkout
        const response = await fetch(`/api/stripe/checkout?plan=${newTier}`, {
          method: "POST",
        })

        if (!response.ok) {
          const error = await response.json()
          
          // If Stripe is not configured, show beautiful dialog
          if (error.code === 'STRIPE_NOT_CONFIGURED') {
            setStripeDialogTitle("Payment Processing Not Available")
            setStripeDialogMessage(`To upgrade to ${getSubscriptionDisplayName(newTier)}, please contact us at info@verixence.com`)
            setIsStripeError(true)
            setShowStripeDialog(true)
            return
          }
          
          throw new Error(error.error || "Failed to create checkout session")
        }

        const data = await response.json()
        
        if (data.url) {
          // Redirect to Stripe checkout
          window.location.href = data.url
        } else {
          throw new Error("No checkout URL received")
        }
      } else {
        // Downgrade to freemium
        const response = await fetch("/api/subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: newTier }),
        })

        if (response.ok) {
          await fetchSubscriptionInfo()
          setStripeDialogTitle("Success")
          setStripeDialogMessage("Subscription updated successfully!")
          setIsStripeError(false)
          setShowStripeDialog(true)
        } else {
          throw new Error("Failed to update subscription")
        }
      }
    } catch (error: any) {
      setStripeDialogTitle("Error")
      setStripeDialogMessage(error.message || "Failed to update subscription")
      setIsStripeError(true)
      setShowStripeDialog(true)
    } finally {
      setUpgrading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  if (!subscriptionInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">Failed to load subscription information</p>
        </CardContent>
      </Card>
    )
  }

  const currentTier = subscriptionInfo.subscription
  const pricing = subscriptionInfo.pricing
  const usage = subscriptionInfo.usage

  return (
    <div ref={subscriptionSectionRef} className="space-y-6">
      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Current Subscription</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold capitalize">{subscriptionInfo.displayName}</span>
              {subscriptionInfo.trial?.isActive && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                  Free Trial
                </span>
              )}
            </div>
          </CardTitle>
          <CardDescription>
            {subscriptionInfo.trial?.isActive 
              ? `Free trial active - ${subscriptionInfo.trial.daysRemaining} day${subscriptionInfo.trial.daysRemaining !== 1 ? 's' : ''} remaining`
              : subscriptionInfo.trial?.isExpired
              ? 'Your free trial has ended. Upgrade to continue enjoying premium features.'
              : subscriptionInfo.status === 'active' 
              ? 'Your subscription is active' 
              : `Status: ${subscriptionInfo.status}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Trial Banner */}
          {subscriptionInfo.trial?.isActive && subscriptionInfo.trial.daysRemaining !== null && subscriptionInfo.trial.daysRemaining <= 3 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertCircle className="h-5 w-5" />
                <div>
                  <p className="font-medium">Trial ending soon!</p>
                  <p className="text-sm">
                    Your free trial ends in {subscriptionInfo.trial.daysRemaining} day{subscriptionInfo.trial.daysRemaining !== 1 ? 's' : ''}. 
                    Upgrade to Pro to continue with unlimited features.
                  </p>
                </div>
              </div>
            </div>
          )}

          {subscriptionInfo.trial?.isExpired && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                <div className="flex-1">
                  <p className="font-medium">Trial Expired - Upgrade Required</p>
                  <p className="text-sm">
                    Your 14-day free trial has ended. Please upgrade to Pro to continue using the service and enjoy unlimited features.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Pricing Display */}
          <div>
            <Label>Plan Details</Label>
            <div className="mt-2">
              {pricing.monthly && (
                <p className="text-2xl font-bold">
                  ${pricing.monthly}
                  <span className="text-base font-normal text-muted-foreground">/{pricing.unit}</span>
                </p>
              )}
              {pricing.yearly && (
                <p className="text-2xl font-bold">
                  ${pricing.yearly}
                  <span className="text-base font-normal text-muted-foreground">/{pricing.unit}</span>
                </p>
              )}
              {!pricing.monthly && !pricing.yearly && (
                <div>
                  <p className="text-2xl font-bold text-muted-foreground">Free</p>
                  {subscriptionInfo.trial?.isActive && (
                    <p className="text-sm text-muted-foreground mt-1">
                      14-day free trial (ends in {subscriptionInfo.trial.daysRemaining} day{subscriptionInfo.trial.daysRemaining !== 1 ? 's' : ''})
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Usage Statistics */}
          <div>
            <Label>Content Usage</Label>
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Content Items</span>
                <span className="font-medium">
                  {usage.content.current} / {usage.content.limit === 999999 ? 'Unlimited' : usage.content.limit}
                </span>
              </div>
              {usage.content.limit !== 999999 && (
                <>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        usage.content.percentage >= 80
                          ? 'bg-red-500'
                          : usage.content.percentage >= 50
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(usage.content.percentage, 100)}%` }}
                    />
                  </div>
                  {usage.content.percentage >= 80 && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      You're approaching your limit. Consider upgrading for unlimited content.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Features */}
          <div>
            <Label>Your Features</Label>
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600" />
                <span>AI Chat & Summaries</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600" />
                <span>Quizzes & Flashcards</span>
              </div>
              {subscriptionInfo.limits.features.unlimitedQuizzes && (
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Unlimited Quizzes & Flashcards</span>
                </div>
              )}
              {subscriptionInfo.limits.features.advancedAI && (
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Advanced AI Features</span>
                </div>
              )}
            </div>
          </div>

          {/* Manage Subscription Button for Paid Plans */}
          {(currentTier === 'pro' || currentTier === 'enterprise') && subscriptionInfo.stripeSubscriptionId && (
            <div className="pt-4 border-t">
              <Button
                onClick={async () => {
                  try {
                    const response = await fetch("/api/stripe/portal", {
                      method: "POST",
                    })

                    if (!response.ok) {
                      const error = await response.json()
                      if (error.code === 'STRIPE_NOT_CONFIGURED') {
                        alert("Payment management is not yet configured. Please contact us at info@verixence.com")
                        return
                      }
                      throw new Error(error.error || "Failed to open customer portal")
                    }

                    const data = await response.json()
                    if (data.url) {
                      window.location.href = data.url
                    }
                  } catch (error: any) {
                    alert(error.message || "Failed to open customer portal")
                  }
                }}
                variant="outline"
                className="w-full"
              >
                Manage Subscription & Billing
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Update payment method, view invoices, or cancel subscription
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upgrade Options - Always show for freemium, especially if trial expired */}
      {(currentTier === 'freemium' || currentTier === 'pro') && (
        <Card>
          <CardHeader>
            <CardTitle>Upgrade Plan</CardTitle>
            <CardDescription>
              Get more features and unlimited access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentTier === 'freemium' && (
              <>
                {/* Pro Plan */}
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Crown className="h-5 w-5 text-yellow-600" />
                      <span className="font-semibold">Pro</span>
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Most Popular</span>
                    </div>
                    <span className="font-bold">$9.99/month</span>
                  </div>
                  {subscriptionInfo.trial?.isActive && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-2">
                      <p className="text-xs text-blue-800 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Upgrade now to continue after your trial ends
                      </p>
                    </div>
                  )}
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>Unlimited content</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>Unlimited AI requests</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>Unlimited quizzes & flashcards</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>Advanced AI features</span>
                    </li>
                  </ul>
                      <Button
                        onClick={() => handleUpgrade('pro')}
                        disabled={upgrading}
                        className="w-full bg-[#EFA07F] hover:bg-[#EFA07F]/90 text-black"
                        data-upgrade-plan="pro"
                      >
                        <ArrowUp className="h-4 w-4 mr-2" />
                        {subscriptionInfo.trial?.isActive ? 'Upgrade to Pro' : 'Upgrade to Pro'}
                      </Button>
                </div>

                {/* Enterprise Plan */}
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold">Enterprise</span>
                    </div>
                    <span className="font-bold">$49/user/year</span>
                  </div>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>Everything in Pro</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>Team management</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>Advanced analytics</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>Dedicated support</span>
                    </li>
                  </ul>
                  <Button
                    onClick={() => handleUpgrade('enterprise')}
                    disabled={upgrading}
                    variant="outline"
                    className="w-full"
                  >
                    Contact Sales
                  </Button>
                </div>
              </>
            )}

            {currentTier === 'pro' && (
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold">Enterprise</span>
                  </div>
                  <span className="font-bold">$49/user/year</span>
                </div>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Everything in Pro</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Team management</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Advanced analytics</span>
                  </li>
                </ul>
                      <Button
                        onClick={() => handleUpgrade('enterprise')}
                        disabled={upgrading}
                        variant="outline"
                        className="w-full"
                        data-upgrade-plan="enterprise"
                      >
                        Upgrade to Enterprise
                      </Button>
              </div>
            )}

            {/* Downgrade Option */}
            {currentTier !== 'freemium' && (
              <div className="pt-4 border-t">
                <Button
                  onClick={() => {
                    if (confirm('Are you sure you want to downgrade to Free? You will lose access to premium features.')) {
                      handleUpgrade('freemium')
                    }
                  }}
                  disabled={upgrading}
                  variant="outline"
                  className="w-full text-red-600 hover:text-red-700"
                >
                  Downgrade to Free
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stripe Not Configured / Success Dialog */}
      <Dialog open={showStripeDialog} onOpenChange={setShowStripeDialog}>
        <DialogContent className="bg-white border border-black/10 shadow-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-black flex items-center gap-2">
              {isStripeError ? (
                <Mail className="h-5 w-5 text-[#EFA07F]" />
              ) : (
                <Check className="h-5 w-5 text-green-600" />
              )}
              {stripeDialogTitle}
            </DialogTitle>
            <DialogDescription className="text-black/70 pt-2">
              {stripeDialogMessage}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex flex-col gap-3">
            {isStripeError && (
              <div className="bg-[#F9E5DD]/50 rounded-lg p-4 border border-[#EFA07F]/30">
                <p className="text-sm text-black/80 mb-2 font-medium">Contact us to upgrade:</p>
                <a 
                  href="mailto:info@verixence.com" 
                  className="text-[#EFA07F] hover:text-[#EFA07F]/80 font-semibold text-sm flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  info@verixence.com
                </a>
              </div>
            )}
            <Button
              onClick={() => setShowStripeDialog(false)}
              className="w-full bg-[#EFA07F] hover:bg-[#EFA07F]/90 text-black"
            >
              {isStripeError ? "Close" : "Got it"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

