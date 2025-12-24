"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { AlertCircle, Clock, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SubscriptionInfo {
  subscription: 'freemium' | 'pro' | 'enterprise'
  trial?: {
    isActive: boolean
    isExpired: boolean
    daysRemaining: number | null
  }
  usage?: {
    content?: {
      current: number
      limit: number
      percentage: number
    }
    aiRequests?: {
      current: number
      limit: number
      percentage: number
    }
  }
  status: string
  aiRequestCountToday?: number
  aiRequestLimit?: number
}

export default function TrialStatusBanner() {
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubscriptionInfo()
  }, [])

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

  if (loading || !subscriptionInfo) {
    return null
  }

  // Show trial expired banner
  if (subscriptionInfo.trial?.isExpired) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">Trial Expired - Upgrade Required</p>
              <p className="text-sm text-red-700">
                Your 14-day free trial has ended. Upgrade to Pro to continue using ChatX with unlimited features.
              </p>
            </div>
          </div>
          <Link href="/dashboard/settings">
            <Button className="bg-[#EFA07F] hover:bg-[#EFA07F]/90 text-black">
              Upgrade Now
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Show trial ending soon banner (3 days or less)
  if (subscriptionInfo.trial?.isActive && subscriptionInfo.trial.daysRemaining !== null && subscriptionInfo.trial.daysRemaining <= 3) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-r-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-semibold text-yellow-900">
                Trial Ending Soon - {subscriptionInfo.trial.daysRemaining} Day{subscriptionInfo.trial.daysRemaining !== 1 ? 's' : ''} Left
              </p>
              <p className="text-sm text-yellow-700">
                Your free trial ends soon. Upgrade to Pro to keep unlimited access to all features.
              </p>
            </div>
          </div>
          <Link href="/dashboard/settings">
            <Button className="bg-[#EFA07F] hover:bg-[#EFA07F]/90 text-black">
              Upgrade Now
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Show usage warning for freemium users approaching limits
  if (subscriptionInfo.subscription === 'freemium' && subscriptionInfo.usage?.content) {
    const contentUsage = subscriptionInfo.usage.content
    if (contentUsage.percentage >= 80 && contentUsage.percentage < 100) {
      return (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-semibold text-blue-900">Approaching Content Limit</p>
                <p className="text-sm text-blue-700">
                  You've used {contentUsage.current} of {contentUsage.limit} content items. Upgrade to Pro for unlimited content.
                </p>
              </div>
            </div>
            <Link href="/dashboard/settings">
              <Button variant="outline" className="border-blue-500 text-blue-700 hover:bg-blue-100">
                Upgrade
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      )
    }
  }

  // Show active trial banner (more than 3 days remaining)
  if (subscriptionInfo.trial?.isActive && subscriptionInfo.trial.daysRemaining !== null && subscriptionInfo.trial.daysRemaining > 3) {
    return (
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-semibold text-blue-900">Free Trial Active</p>
              <p className="text-sm text-blue-700">
                {subscriptionInfo.trial.daysRemaining} day{subscriptionInfo.trial.daysRemaining !== 1 ? 's' : ''} remaining in your free trial. Enjoy unlimited access!
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

