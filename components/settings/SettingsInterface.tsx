"use client"

import { useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { User } from "lucide-react"
import SubscriptionManagement from "./SubscriptionManagement"

interface SettingsInterfaceProps {
  user: any
  searchParams?: { success?: string; canceled?: string; session_id?: string; upgrade?: string }
}

export default function SettingsInterface({ user, searchParams }: SettingsInterfaceProps) {
  // Handle Stripe checkout success/cancel messages
  useEffect(() => {
    if (searchParams?.success === 'true') {
      alert("Payment successful! Your subscription has been activated.")
      // Refresh subscription info
      window.history.replaceState({}, '', '/settings')
    } else if (searchParams?.canceled === 'true') {
      // User canceled - silently clear URL, no need to alert
      window.history.replaceState({}, '', '/settings')
    }
  }, [searchParams])

      return (
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 px-4 sm:px-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Account Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Email</Label>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          {user?.name && (
            <div>
              <Label>Name</Label>
              <p className="text-sm text-muted-foreground">{user.name}</p>
            </div>
          )}
          {user?.created_at && (
            <div>
              <Label>Member Since</Label>
              <p className="text-sm text-muted-foreground">
                {new Date(user.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription Management */}
      <SubscriptionManagement user={user} upgradePlan={searchParams?.upgrade} />
    </div>
  )
}

