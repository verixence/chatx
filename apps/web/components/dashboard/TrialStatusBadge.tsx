"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Clock, AlertCircle, Sparkles } from "lucide-react"

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
  }
  status: string
}

export default function TrialStatusBadge() {
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubscriptionInfo()
    // Refresh subscription info every 5 minutes to update days remaining
    const interval = setInterval(() => {
      fetchSubscriptionInfo()
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
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

  // Trial expired - show subtle badge with upgrade link
  if (subscriptionInfo.trial?.isExpired) {
    return (
      <Link 
        href="/settings"
        className="fixed top-16 right-2 z-50 group sm:top-20 sm:right-4 md:right-6"
      >
        <div className="bg-red-500/90 backdrop-blur-sm text-white px-3 py-2 sm:px-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-1.5 sm:gap-2 border border-red-400/30 min-h-[44px] touch-manipulation">
          <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium whitespace-nowrap">Trial Expired</span>
          <span className="text-xs opacity-90 hidden sm:inline">→ Upgrade</span>
        </div>
      </Link>
    )
  }

  // Trial ending soon (3 days or less) - show warning badge
  if (subscriptionInfo.trial?.isActive && subscriptionInfo.trial.daysRemaining !== null && subscriptionInfo.trial.daysRemaining <= 3) {
    return (
      <Link 
        href="/settings"
        className="fixed top-16 right-2 z-50 group sm:top-20 sm:right-4 md:right-6"
      >
        <div className="bg-yellow-500/90 backdrop-blur-sm text-white px-3 py-2 sm:px-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-1.5 sm:gap-2 border border-yellow-400/30 animate-pulse min-h-[44px] touch-manipulation">
          <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium whitespace-nowrap">{subscriptionInfo.trial.daysRemaining} Day{subscriptionInfo.trial.daysRemaining !== 1 ? 's' : ''} Left</span>
          <span className="text-xs opacity-90 hidden sm:inline">→ Upgrade</span>
        </div>
      </Link>
    )
  }

  // Usage warning for freemium users approaching limits
  if (subscriptionInfo.subscription === 'freemium' && subscriptionInfo.usage?.content) {
    const contentUsage = subscriptionInfo.usage.content
    if (contentUsage.percentage >= 80 && contentUsage.percentage < 100) {
      return (
        <Link 
          href="/settings"
          className="fixed top-16 right-2 z-50 group sm:top-20 sm:right-4 md:right-6"
        >
          <div className="bg-blue-500/90 backdrop-blur-sm text-white px-3 py-2 sm:px-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-1.5 sm:gap-2 border border-blue-400/30 min-h-[44px] touch-manipulation">
            <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-medium whitespace-nowrap">{contentUsage.current}/{contentUsage.limit} Content</span>
            <span className="text-xs opacity-90 hidden sm:inline">→ Upgrade</span>
          </div>
        </Link>
      )
    }
  }

  // Active trial (more than 3 days) - show subtle badge
  if (subscriptionInfo.trial?.isActive && subscriptionInfo.trial.daysRemaining !== null && subscriptionInfo.trial.daysRemaining > 3) {
    return (
      <div className="fixed top-16 right-2 z-50 sm:top-20 sm:right-4 md:right-6">
        <div className="bg-[#EFA07F]/90 backdrop-blur-sm text-black px-3 py-2 sm:px-4 rounded-full shadow-lg border border-[#EFA07F]/50 flex items-center gap-1.5 sm:gap-2 min-h-[44px]">
          <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
            {subscriptionInfo.trial.daysRemaining} Day{subscriptionInfo.trial.daysRemaining !== 1 ? 's' : ''} Free Trial
          </span>
        </div>
      </div>
    )
  }

  return null
}

