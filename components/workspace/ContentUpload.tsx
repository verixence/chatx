"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Youtube, Clipboard } from "lucide-react"
// Removed supabaseBrowser import - using server-side upload endpoint instead

interface ContentUploadProps {
  workspaceId: string
  onClose: () => void
  initialType?: "upload" | "link" | "paste"
  onUploadSuccess?: (workspaceId: string, contentId: string) => void
  initialFile?: File | null
}

export default function ContentUpload({ workspaceId, onClose, initialType, onUploadSuccess, initialFile }: ContentUploadProps) {
  // Map action types to content types - memoized to persist initial selection
  const initialContentType = useMemo(() => {
    if (initialType === "link") return "youtube"
    if (initialType === "paste") return "text"
    if (initialType === "upload") return "pdf"
    return "pdf"
  }, [initialType])
  
  const [type, setType] = useState<"pdf" | "youtube" | "text">(initialContentType)
  const [file, setFile] = useState<File | null>(initialFile || null)
  const [url, setUrl] = useState("")
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [processingStatus, setProcessingStatus] = useState<string>("")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [currentStage, setCurrentStage] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Auto-trigger file picker for PDF when modal opens (if no file provided)
  useEffect(() => {
    if (type === "pdf" && !file && !loading) {
      // Small delay to ensure modal is rendered
      const timer = setTimeout(() => {
        fileInputRef.current?.click()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [type, file, loading])

  // Auto-submit if file is provided via prop
  useEffect(() => {
    if (type === "pdf" && file && initialFile && !loading) {
      // Small delay to ensure form is ready
      const timer = setTimeout(() => {
        const form = document.querySelector('form')
        if (form) {
          const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
          form.dispatchEvent(submitEvent)
        }
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [type, file, initialFile, loading])

  const simulateProgress = (targetPercent: number, stage: string, duration: number = 1000) => {
    return new Promise<void>((resolve) => {
      setCurrentStage(stage)
      const startPercent = uploadProgress
      const increment = (targetPercent - startPercent) / (duration / 50)
      let current = startPercent
      
      const interval = setInterval(() => {
        current += increment
        if (current >= targetPercent) {
          setUploadProgress(targetPercent)
          clearInterval(interval)
          resolve()
        } else {
          setUploadProgress(Math.min(current, targetPercent))
        }
      }, 50)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setProcessingStatus("")
    setUploadProgress(0)
    setCurrentStage("")

    // Validate text input before upload
    if (type === "text" && (!text || text.trim().length === 0)) {
      setError("Please enter some text content")
      setLoading(false)
      return
    }

    try {
      console.log(`[UPLOAD] Starting upload, type: ${type}`)
      
      // PDF: upload directly to Supabase Storage to avoid Vercel body limits.
      if (type === "pdf") {
        if (!file) {
          setError("Please choose a PDF file")
          setLoading(false)
          return
        }

        setCurrentStage("Uploading file...")
        setUploadProgress(10)
        await simulateProgress(30, "Uploading file...", 500)
        
        console.log(`[UPLOAD] Uploading PDF via server endpoint, size: ${file.size} bytes`)
        
        const uploadFormData = new FormData()
        uploadFormData.append("file", file)
        uploadFormData.append("workspaceId", workspaceId)

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        })

        await simulateProgress(60, "Uploading file...", 300)

        if (!uploadResponse.ok) {
          let errorMessage = "Failed to upload PDF"
          let errorDetails = ""
          try {
            const errorData = await uploadResponse.json()
            errorMessage = errorData.error || errorMessage
            errorDetails = errorData.details || ""
          } catch {
            errorMessage = `Server error: ${uploadResponse.status} ${uploadResponse.statusText}`
          }
          setError(errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage)
          setLoading(false)
          setUploadProgress(0)
          return
        }

        const uploadData = await uploadResponse.json()
        const storagePath = uploadData.path

        if (!storagePath) {
          console.error("Upload succeeded but no path returned")
          setError("Upload succeeded but failed to get file path. Please try again.")
          setLoading(false)
          setUploadProgress(0)
          return
        }

        console.log(`[UPLOAD] PDF uploaded successfully: ${storagePath}`)
        setCurrentStage("Processing content...")
        await simulateProgress(75, "Processing content...", 200)

        // Now trigger ingestion with the storage path
        const formData = new FormData()
        formData.append("type", type)
        formData.append("workspaceId", workspaceId)
        formData.append("storagePath", storagePath)

        const response = await fetch("/api/ingest", {
          method: "POST",
          body: formData,
        })

        await simulateProgress(85, "Processing content...", 300)

        if (!response.ok) {
          let errorMessage = "Failed to upload content"
          let errorDetails = ""
          try {
            const data = await response.json()
            errorMessage = data.error || errorMessage
            errorDetails = data.details || ""
          } catch {
            errorMessage = `Server error: ${response.status} ${response.statusText}`
          }
          setError(errorDetails ? `${errorMessage}\n\n${errorDetails}` : errorMessage)
          setLoading(false)
          setUploadProgress(0)
          return
        }

        const dataResp = await response.json()
        console.log(`[UPLOAD] Ingestion successful, contentId: ${dataResp.contentId}`)

        // Trigger processing and wait for it to complete for better UX
        setCurrentStage("Generating summary...")
        await simulateProgress(95, "Generating summary...", 200)
        
        try {
          const processResponse = await fetch("/api/process", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contentId: dataResp.contentId }),
          })
          if (processResponse.ok) {
            console.log(`[UPLOAD] Processing complete for contentId: ${dataResp.contentId}`)
          } else {
            console.warn("[UPLOAD] Processing returned non-ok status, continuing anyway")
          }
        } catch (err) {
          console.error("Failed to trigger processing:", err)
          // Don't block - content is still usable
        }
        
        await simulateProgress(100, "Complete!", 200)

        onClose()
        
        // Redirect directly to the content page
        window.location.href = `/workspace/${workspaceId}/content/${dataResp.contentId}`
        return
      }

      // YouTube + Text still use small FormData payloads directly to /api/ingest.
      const formData = new FormData()
      formData.append("type", type)
      formData.append("workspaceId", workspaceId)

      if (type === "youtube") {
        setCurrentStage("Fetching video metadata...")
        setUploadProgress(20)
        await simulateProgress(40, "Fetching video metadata...", 800)
        formData.append("url", url)
      } else if (type === "text") {
        setCurrentStage("Processing text...")
        setUploadProgress(30)
        await simulateProgress(50, "Processing text...", 500)
        formData.append("text", text.trim())
      }

      console.log(`[UPLOAD] Sending to /api/ingest, type: ${type}`)
      const response = await fetch("/api/ingest", {
        method: "POST",
        body: formData,
      })

      await simulateProgress(70, type === "youtube" ? "Processing video..." : "Processing content...", 600)

      if (!response.ok) {
        let errorMessage = "Failed to upload content"
        let errorDetails = ""
        try {
          const data = await response.json()
          errorMessage = data.error || errorMessage
          errorDetails = data.details || ""
        } catch {
          // If response is not JSON (e.g., HTML error page), use status text
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        // Combine error message and details
        setError(errorDetails ? `${errorMessage}\n\n${errorDetails}` : errorMessage)
        setLoading(false)
        setUploadProgress(0)
        return
      }

      const data = await response.json()
      console.log(`[UPLOAD] Ingestion successful, contentId: ${data.contentId}`)

      // Don't wait for processing - redirect immediately (like YouLearn)
      // Processing happens in background
      await simulateProgress(100, "Upload complete!", 200)

      onClose()
      
      // Redirect immediately to content page
      window.location.href = `/workspace/${workspaceId}/content/${data.contentId}`
    } catch (err: any) {
      console.error("[UPLOAD] Error:", err)
      setError(err.message || "An error occurred")
      setUploadProgress(0)
    } finally {
      setLoading(false)
      setProcessingStatus("")
    }
  }

  return (
    <>
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
      {loading ? (
        <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-[#1e3a8a] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-lg font-medium text-gray-900">Uploading...</p>
          </div>
        </div>
      ) : (
        <Dialog open={true} onOpenChange={onClose}>
          <DialogContent className={type === "youtube" ? "max-w-lg" : type === "text" ? "max-w-2xl" : "max-w-2xl"}>
            {type === "youtube" ? (
            // YouTube: Simple URL input modal
            <form onSubmit={handleSubmit} className="space-y-6">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Youtube className="h-5 w-5 text-red-500" />
                  YouTube Video
                </DialogTitle>
                <DialogDescription>
                  Paste your YouTube video URL to get started
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-2">
                <Input
                  id="url"
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="text-base h-12"
                  required
                  autoFocus
                />
              </div>

              {error && (
                <div className="p-4 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
                  <div className="font-semibold mb-1">Error</div>
                  <div className="whitespace-pre-line">{error}</div>
                </div>
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={loading} className="w-full sm:w-auto min-w-[120px]">
                  Add
                </Button>
              </div>
            </form>
          ) : type === "text" ? (
            // Text: Only textarea, no content type field
            <form onSubmit={handleSubmit} className="space-y-4">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Clipboard className="h-5 w-5 text-blue-500" />
                  Paste Text
                </DialogTitle>
                <DialogDescription>
                  Copy and paste text to add as content
                </DialogDescription>
              </DialogHeader>

              <Textarea
                id="text"
                placeholder="Paste your notes here"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={12}
                className="resize-none"
                required
                autoFocus
              />

              {error && (
                <div className="p-4 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
                  <div className="font-semibold mb-1">Error</div>
                  <div className="whitespace-pre-line">{error}</div>
                </div>
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={loading} className="w-full sm:w-auto min-w-[120px]">
                  Add
                </Button>
              </div>
            </form>
          ) : (
            // PDF: Standard form (but this should rarely show as PDF opens file picker directly)
            <form onSubmit={handleSubmit} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Upload PDF</DialogTitle>
                <DialogDescription>
                  Select a PDF file to upload
                </DialogDescription>
              </DialogHeader>

              <div>
                <Label htmlFor="file">PDF File</Label>
                <Input
                  ref={fileInputRef}
                  id="file"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0] || null
                    setFile(selectedFile)
                    if (selectedFile) {
                      // Auto-submit when file is selected
                      setTimeout(() => {
                        const form = e.target.closest('form')
                        if (form) {
                          const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
                          form.dispatchEvent(submitEvent)
                        }
                      }, 100)
                    }
                  }}
                  required
                  className="hidden"
                />
                {file && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-md border border-gray-200">
                    <p className="text-sm text-gray-700">Selected: <span className="font-medium">{file.name}</span></p>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-4 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
                  <div className="font-semibold mb-1">Error</div>
                  <div className="whitespace-pre-line">{error}</div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  Upload
                </Button>
              </div>
            </form>
          )}
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

