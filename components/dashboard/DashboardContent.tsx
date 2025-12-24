"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Youtube, Link as LinkIcon, Clipboard } from "lucide-react"
import dynamic from "next/dynamic"

// Lazy load ContentUpload for better initial page load
const ContentUpload = dynamic(() => import("@/components/workspace/ContentUpload"), {
  ssr: false,
  loading: () => null,
})
import RecentsSection from "@/components/workspace/RecentsSection"
import TrialStatusBanner from "./TrialStatusBanner"

interface Content {
  id: string
  type: "pdf" | "youtube" | "text" | "audio" | "video"
  raw_url?: string | null
  metadata?: any
  created_at: string
  workspace_id: string
  title: string
  status?: "processing" | "ready" | "partial"
}

interface DashboardContentProps {
  contents: Content[]
  userId: string
  defaultWorkspaceId: string
}

export default function DashboardContent({ contents, userId, defaultWorkspaceId }: DashboardContentProps) {
  const router = useRouter()
  const [showUpload, setShowUpload] = useState(false)
  const [uploadType, setUploadType] = useState<"upload" | "link" | "paste" | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  const handleUploadSuccess = useCallback((workspaceId: string, contentId: string) => {
    // Refresh the page to show new content
    router.refresh()
  }, [router])

  const handleContentAction = useCallback((type: "upload" | "link" | "paste") => {
    if (!defaultWorkspaceId) {
      alert("Please wait while we set up your workspace...")
      return
    }
    
    // For PDF upload, directly open file picker
    if (type === "upload") {
      const input = document.createElement("input")
      input.type = "file"
      input.accept = ".pdf"
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) return
        
        // Set file and show upload modal
        setSelectedFile(file)
        setUploadType("upload")
        setShowUpload(true)
      }
      input.click()
      return
    }
    
    setUploadType(type)
    setShowUpload(true)
  }, [defaultWorkspaceId])

  // Handle drag and drop for PDF
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0 && files[0].type === "application/pdf") {
      // Store the file temporarily and trigger upload flow
      handleContentAction("upload")
    }
  }, [])

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Trial/Usage Status Banner */}
        <TrialStatusBanner />

        {/* What do you want to learn? Section */}
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-black mb-4 sm:mb-6">
            What do you want to learn?
          </h1>
          <p className="text-lg text-black/70 mb-8 sm:mb-12">
            Upload your materials and let AI help you study smarter
          </p>
          
          {/* Input Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 max-w-4xl mx-auto">
            {/* PDF Upload with Drag & Drop */}
            <button
              onClick={() => handleContentAction("upload")}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center p-6 sm:p-8 bg-white/95 backdrop-blur-sm rounded-2xl border-2 border-dashed transition-all cursor-pointer group min-h-[160px] shadow-lg hover:shadow-xl ${
                isDragging 
                  ? "border-[#EFA07F] bg-[#F9E5DD] scale-[1.02] shadow-[#EFA07F]/20" 
                  : "border-black/10 hover:border-[#EFA07F] hover:bg-[#F9E5DD]/30"
              }`}
            >
              <div className={`p-4 rounded-2xl mb-4 transition-colors ${
                isDragging ? "bg-[#F9E5DD]" : "bg-[#F9E5DD]/50 group-hover:bg-[#F9E5DD]"
              }`}>
                <FileText className={`h-12 w-12 sm:h-14 sm:w-14 transition-colors ${
                  isDragging ? "text-[#EFA07F]" : "text-[#EFA07F] group-hover:text-[#EFA07F]"
                }`} />
              </div>
              <span className="text-base sm:text-lg font-semibold text-black mb-1">PDF Document</span>
              <span className="text-xs sm:text-sm text-black/60">Click or drag & drop</span>
            </button>
            
            {/* YouTube Link */}
            <button
              onClick={() => handleContentAction("link")}
              className="flex flex-col items-center justify-center p-6 sm:p-8 bg-white/95 backdrop-blur-sm rounded-2xl border-2 border-black/10 hover:border-[#EFA07F] hover:bg-[#F9E5DD]/30 transition-all cursor-pointer group min-h-[160px] shadow-lg hover:shadow-xl"
            >
              <div className="p-4 rounded-2xl bg-[#F9E5DD]/50 group-hover:bg-[#F9E5DD] mb-4 transition-colors">
                <Youtube className="h-12 w-12 sm:h-14 sm:w-14 text-[#EFA07F] group-hover:text-[#EFA07F] transition-colors" />
              </div>
              <span className="text-base sm:text-lg font-semibold text-black mb-1">YouTube Video</span>
              <span className="text-xs sm:text-sm text-black/60">Paste video URL</span>
            </button>
            
            {/* Paste Text */}
            <button
              onClick={() => handleContentAction("paste")}
              className="flex flex-col items-center justify-center p-6 sm:p-8 bg-white/95 backdrop-blur-sm rounded-2xl border-2 border-black/10 hover:border-[#EFA07F] hover:bg-[#F9E5DD]/30 transition-all cursor-pointer group min-h-[160px] shadow-lg hover:shadow-xl"
            >
              <div className="p-4 rounded-2xl bg-[#F9E5DD]/50 group-hover:bg-[#F9E5DD] mb-4 transition-colors">
                <Clipboard className="h-12 w-12 sm:h-14 sm:w-14 text-[#EFA07F] group-hover:text-[#EFA07F] transition-colors" />
              </div>
              <span className="text-base sm:text-lg font-semibold text-black mb-1">Paste Text</span>
              <span className="text-xs sm:text-sm text-black/60">Notes, articles, etc.</span>
            </button>
          </div>

        </div>

        {/* Recent Files Section */}
        <div className="mt-16 sm:mt-20">
          {contents.length > 0 ? (
            <RecentsSection
              contents={contents}
              workspaceName="Recent Files"
            />
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#F9E5DD] mb-6">
                <FileText className="h-10 w-10 text-[#EFA07F]" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-2">No content yet</h3>
              <p className="text-black/70 mb-6 text-lg">Upload your first learning material to get started!</p>
            </div>
          )}
        </div>
      </div>

      {/* Content Upload Dialog */}
      {showUpload && defaultWorkspaceId && (
        <ContentUpload
          workspaceId={defaultWorkspaceId}
          initialType={uploadType || undefined}
          initialFile={selectedFile}
          onClose={() => {
            setShowUpload(false)
            setUploadType(null)
            setSelectedFile(null)
          }}
          onUploadSuccess={handleUploadSuccess}
        />
      )}
    </div>
  )
}

