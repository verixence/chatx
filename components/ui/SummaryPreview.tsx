"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, FileText, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface SummaryPreviewProps {
  summary: string
  onViewFull?: () => void
  className?: string
}

/**
 * Extracts a preview (first 2-3 sentences) from markdown summary
 */
function extractPreview(summary: string, maxLength: number = 200): string {
  // Remove markdown headers and get plain text
  const plainText = summary
    .replace(/^#+\s+/gm, '') // Remove headers
    .replace(/\*\*/g, '') // Remove bold
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove links, keep text
    .trim()

  if (plainText.length <= maxLength) {
    return plainText
  }

  // Try to cut at sentence boundaries
  const sentences = plainText.match(/[^.!?]+[.!?]+/g) || []
  let preview = ''
  for (const sentence of sentences) {
    if ((preview + sentence).length > maxLength) break
    preview += sentence + ' '
  }

  // Fallback to character limit if no sentences found
  if (!preview) {
    preview = plainText.substring(0, maxLength).trim()
    // Try to cut at last space to avoid cutting words
    const lastSpace = preview.lastIndexOf(' ')
    if (lastSpace > maxLength * 0.8) {
      preview = preview.substring(0, lastSpace)
    }
    preview += '...'
  }

  return preview.trim()
}

export default function SummaryPreview({ summary, onViewFull, className }: SummaryPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const previewText = extractPreview(summary, 180)
  const hasMore = summary.length > previewText.length

  return (
    <div className={cn("bg-gradient-to-br from-[#EFA07F]/5 to-[#EFA07F]/10 border border-[#EFA07F]/20 rounded-xl p-4 shadow-sm", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#EFA07F] to-[#EFA07F]/70 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">AI Summary</h3>
            <p className="text-xs text-gray-500">Quick overview of this content</p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={isExpanded ? "Collapse summary" : "Expand summary"}
        >
          {isExpanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="text-sm text-gray-700 leading-relaxed">
        {isExpanded ? (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed text-sm text-gray-700">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-outside ml-4 mb-2 space-y-1 text-sm text-gray-700">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-outside ml-4 mb-2 space-y-1 text-sm text-gray-700">{children}</ol>,
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                h1: ({ children }) => <h1 className="text-base font-bold mb-2 mt-3 first:mt-0 text-gray-900">{children}</h1>,
                h2: ({ children }) => <h2 className="text-sm font-semibold mb-1 mt-2 first:mt-0 text-gray-900">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 mt-2 first:mt-0 text-gray-800">{children}</h3>,
              }}
            >
              {summary}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm text-gray-700 leading-relaxed">{previewText}{hasMore && '...'}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#EFA07F]/20">
        {onViewFull && (
          <button
            onClick={onViewFull}
            className="text-xs font-medium text-[#EFA07F] hover:text-[#EFA07F]/80 transition-colors flex items-center gap-1 min-h-[44px] px-2 touch-manipulation"
          >
            <FileText className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="whitespace-nowrap">View Full Summary</span>
          </button>
        )}
        {hasMore && !isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            className="text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors min-h-[44px] px-2 touch-manipulation"
          >
            Show more
          </button>
        )}
      </div>
    </div>
  )
}

