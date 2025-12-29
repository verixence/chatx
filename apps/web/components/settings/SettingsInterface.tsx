"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { User, Lock, Trash2, Mail } from "lucide-react"
import { signOut } from "next-auth/react"
import SubscriptionManagement from "./SubscriptionManagement"

interface SettingsInterfaceProps {
  user: any
  searchParams?: { success?: string; canceled?: string; session_id?: string; upgrade?: string }
}

export default function SettingsInterface({ user, searchParams }: SettingsInterfaceProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMessage(null)

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }

    setPasswordLoading(true)
    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      })

      const data = await response.json()

      if (response.ok) {
        setPasswordMessage({ type: 'success', text: 'Password changed successfully!' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setPasswordMessage({ type: 'error', text: data.error || 'Failed to change password' })
      }
    } catch (error) {
      setPasswordMessage({ type: 'error', text: 'An error occurred. Please try again.' })
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you absolutely sure? This will permanently delete your account and all associated data. This action cannot be undone.')) {
      return
    }

    if (!confirm('This is your last chance. Are you sure you want to delete your account?')) {
      return
    }

    try {
      const response = await fetch('/api/user', {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('Your account has been deleted.')
        await signOut({ callbackUrl: '/login' })
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete account')
      }
    } catch (error) {
      alert('An error occurred. Please try again.')
    }
  }

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

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lock className="h-5 w-5" />
            <span>Change Password</span>
          </CardTitle>
          <CardDescription>Update your password to keep your account secure</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1"
              />
            </div>
            {passwordMessage && (
              <div className={`p-3 rounded-md text-sm ${
                passwordMessage.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {passwordMessage.text}
              </div>
            )}
            <Button type="submit" disabled={passwordLoading} className="bg-[#FB923C] hover:bg-[#F97316]">
              {passwordLoading ? 'Changing Password...' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Support */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5" />
            <span>Support</span>
          </CardTitle>
          <CardDescription>Get help when you need it</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Contact Support</Label>
            <p className="text-sm text-muted-foreground">
              Need help? Email us at{' '}
              <a href="mailto:info@verixence.com" className="text-[#FB923C] hover:underline font-medium">
                info@verixence.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            <span>Delete Account</span>
          </CardTitle>
          <CardDescription>Permanently delete your account and all associated data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> This action cannot be undone. All your data, including workspaces,
                content, quizzes, flashcards, and progress will be permanently deleted.
              </p>
            </div>
            <Button
              onClick={handleDeleteAccount}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
            >
              Delete My Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
