"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Share2, Copy, Check } from "lucide-react"

interface ShareWorkspaceProps {
  workspaceId: string
  isShared: boolean
}

export default function ShareWorkspace({ workspaceId, isShared }: ShareWorkspaceProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [shareUrl, setShareUrl] = useState("")
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/workspace/${workspaceId}/share`, {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to share workspace")
      }

      setShareUrl(data.shareUrl)
    } catch (error: any) {
      alert(error.message || "Failed to share workspace")
    } finally {
      setLoading(false)
    }
  }

  const handleUnshare = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/workspace/${workspaceId}/share`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to unshare workspace")
      }

      setShareUrl("")
      setOpen(false)
      window.location.reload()
    } catch (error: any) {
      alert(error.message || "Failed to unshare workspace")
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="flex items-center space-x-2"
      >
        <Share2 className="h-4 w-4" />
        <span>{isShared ? "Shared" : "Share"}</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Workspace</DialogTitle>
            <DialogDescription>
              Share this workspace with others via a link
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {isShared && shareUrl ? (
              <div className="space-y-2">
                <Label>Share Link</Label>
                <div className="flex space-x-2">
                  <Input value={shareUrl} readOnly />
                  <Button onClick={handleCopy} size="icon">
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button
                  variant="destructive"
                  onClick={handleUnshare}
                  disabled={loading}
                  className="w-full"
                >
                  Stop Sharing
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleShare}
                disabled={loading}
                className="w-full"
              >
                {loading ? "Generating link..." : "Generate Share Link"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

