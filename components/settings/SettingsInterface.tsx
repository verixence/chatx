"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Settings, User, Zap } from "lucide-react"

interface SettingsInterfaceProps {
  user: any
}

export default function SettingsInterface({ user }: SettingsInterfaceProps) {
  const [aiProvider, setAiProvider] = useState(user?.aiProvider || "openai")
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiProvider }),
      })

      if (!response.ok) {
        throw new Error("Failed to save settings")
      }

      alert("Settings saved successfully!")
    } catch (error: any) {
      alert(error.message || "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
            <span>Account</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Email</Label>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <div>
            <Label>Subscription</Label>
            <p className="text-sm font-medium capitalize">{user?.subscription || "Free"}</p>
            {user?.subscription === "freemium" && (
              <p className="text-xs text-muted-foreground mt-1">
                Upgrade to Pro for unlimited features
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>AI Preferences</span>
          </CardTitle>
          <CardDescription>
            Choose your preferred AI provider for content processing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="aiProvider">AI Provider</Label>
            <Select
              id="aiProvider"
              value={aiProvider}
              onChange={(e) => setAiProvider(e.target.value)}
            >
              <option value="groq">Groq (Llama 3.1) - Primary</option>
              <option value="openai">OpenAI (GPT-4o) - Fallback</option>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              This affects how your content is processed and summarized
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Preferences"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

