"use client"

import { useState, Suspense } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileText, Youtube, File, Link as LinkIcon, Clipboard, Upload } from "lucide-react"

// Lazy load heavy components
const ContentUpload = dynamic(() => import("./ContentUpload"), {
  ssr: false,
  loading: () => null,
})

const RecentsSection = dynamic(() => import("./RecentsSection"), {
  loading: () => (
    <div className="space-y-3 sm:space-y-4">
      <h2 className="text-lg sm:text-xl font-bold text-black">Recents</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/95 backdrop-blur-sm border border-black/10 rounded-xl overflow-hidden animate-pulse">
            <div className="w-full h-[140px] bg-[#F9E5DD]/30" />
            <div className="p-3 sm:p-4 space-y-2">
              <div className="h-4 bg-[#F9E5DD]/50 rounded w-3/4" />
              <div className="h-3 bg-[#F9E5DD]/50 rounded w-1/2" />
              <div className="h-3 bg-[#F9E5DD]/50 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
})

interface WorkspaceViewProps {
  workspace: any
  userId: string
}

export default function WorkspaceView({ workspace, userId }: WorkspaceViewProps) {
  const [showUpload, setShowUpload] = useState(false)
  const [uploadType, setUploadType] = useState<"upload" | "link" | "paste" | null>(null)

  const handleOpenUpload = (type: "upload" | "link" | "paste") => {
    setUploadType(type)
    setShowUpload(true)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-black">{workspace.name}</h1>
        <p className="text-sm text-black/70">
          {workspace.description || "No description"}
        </p>
      </div>

      {/* What do you want to learn? */}
      <Card className="border border-slate-200 bg-white rounded-3xl shadow-lg">
        <CardContent className="py-10 px-4 sm:px-8 lg:px-16">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              What do you want to learn?
            </h2>
          </div>

          {/* Upload options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 max-w-3xl mx-auto">
            <button
              onClick={() => handleOpenUpload("upload")}
              className="flex flex-col items-center justify-center p-5 sm:p-7 bg-white rounded-2xl border-2 border-dashed border-red-200 hover:border-red-400 hover:bg-red-50 transition-all cursor-pointer group shadow-md hover:shadow-lg"
            >
              <div className="p-3 rounded-xl bg-red-50 group-hover:bg-red-100 mb-3 transition-colors">
                <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-red-500 group-hover:text-red-600 transition-colors" />
              </div>
              <span className="text-sm font-semibold text-slate-800">PDF Document</span>
              <span className="text-xs text-slate-500 mt-1">Click or drag & drop</span>
            </button>

            <button
              onClick={() => handleOpenUpload("link")}
              className="flex flex-col items-center justify-center p-5 sm:p-7 bg-white rounded-2xl border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer group shadow-md hover:shadow-lg"
            >
              <div className="p-3 rounded-xl bg-blue-50 group-hover:bg-blue-100 mb-3 transition-colors">
                <Youtube className="h-10 w-10 sm:h-12 sm:w-12 text-red-500 group-hover:text-red-600 transition-colors" />
              </div>
              <span className="text-sm font-semibold text-slate-800">YouTube Video</span>
              <span className="text-xs text-slate-500 mt-1">Paste video URL</span>
            </button>

            <button
              onClick={() => handleOpenUpload("paste")}
              className="flex flex-col items-center justify-center p-5 sm:p-7 bg-white rounded-2xl border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 transition-all cursor-pointer group shadow-md hover:shadow-lg"
            >
              <div className="p-3 rounded-xl bg-purple-50 group-hover:bg-purple-100 mb-3 transition-colors">
                <Clipboard className="h-10 w-10 sm:h-12 sm:w-12 text-purple-500 group-hover:text-purple-600 transition-colors" />
              </div>
              <span className="text-sm font-semibold text-slate-800">Paste Text</span>
              <span className="text-xs text-slate-500 mt-1">Notes, articles, etc.</span>
            </button>
          </div>

        </CardContent>
      </Card>

      {/* Recents Section */}
      {workspace.contents.length > 0 ? (
        <RecentsSection
          contents={workspace.contents}
          workspaceName={workspace.name}
        />
      ) : (
        <Card className="border border-black/10 bg-white/95 backdrop-blur-sm shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#F9E5DD] mb-4">
              <FileText className="h-8 w-8 text-[#EFA07F]" />
            </div>
            <h4 className="text-xl font-bold mb-2 text-black">No content yet</h4>
            <p className="text-black/70 text-center mb-6">
              Upload your first learning material to get started!
            </p>
            <Button onClick={() => handleOpenUpload("upload")} className="bg-[#EFA07F] hover:bg-[#EFA07F]/90 text-black shadow-lg rounded-full">
              <Upload className="h-4 w-4 mr-2" />
              Add Content
            </Button>
          </CardContent>
        </Card>
      )}

      {showUpload && (
        <ContentUpload
          workspaceId={workspace.id}
          initialType={uploadType || "upload"}
          onClose={() => {
            setShowUpload(false)
            setUploadType(null)
          }}
        />
      )}
    </div>
  )
}

