"use client"

import { cn } from "@/lib/utils/cn"

interface PDFViewerSimpleProps {
  url: string
  className?: string
}

export default function PDFViewerSimple({ url, className = "" }: PDFViewerSimpleProps) {
  return (
    <div className={cn("flex flex-col h-full bg-[#f9fafb] min-h-0", className)}>
      <div className="flex-1 min-h-0 overflow-hidden">
        <iframe
          src={url}
          className="w-full h-full border-0"
          title="PDF Document"
        />
      </div>
    </div>
  )
}

