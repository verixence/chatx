"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"

interface ProcessButtonProps {
  contentId: string
}

export default function ProcessButton({ contentId }: ProcessButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleProcess = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId }),
      })

      if (response.ok) {
        // Refresh the page to show the summary
        setTimeout(() => {
          router.refresh()
        }, 1000)
      } else {
        const data = await response.json()
        const errorMsg = data.details 
          ? `${data.error}\n\n${data.details}`
          : data.error || "Unknown error"
        alert(`Failed to process: ${errorMsg}`)
      }
    } catch (error: any) {
      alert(`Error: ${error.message || "Failed to process content"}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleProcess}
      disabled={loading}
    >
      <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
      {loading ? "Processing..." : "Generate Summary"}
    </Button>
  )
}

