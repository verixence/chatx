"use client"

import { useMemo, useRef, useState, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { Content, ProcessedContent, Quiz, Flashcard } from "@/lib/db/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import ChatInterface from "@/components/chat/ChatInterface"
import QuizInterface from "@/components/quiz/QuizInterface"
import FlashcardsInterface from "@/components/flashcards/FlashcardsInterface"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { cn } from "@/lib/utils/cn"
import TextSelectionPopup from "@/components/ui/TextSelectionPopup"

// Use simple iframe-based PDF viewer to avoid PDF.js loading issues
const PDFViewer = dynamic(() => import("@/components/pdf/PDFViewerSimple"), {
  ssr: false,
  loading: () => (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a8a]"></div>
        <p className="mt-4 text-sm text-slate-600 font-medium">Loading PDF viewer...</p>
      </div>
  ),
})
import {
  ExternalLink,
  Youtube,
  File,
  FileText,
  ArrowLeft,
  Maximize2,
  Minimize2,
} from "lucide-react"

// Dynamically import ReactPlayer
// Note: We'll use a state-based approach to access the player instance
const ReactPlayer = dynamic(
  () => import("react-player"),
  { 
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full text-muted-foreground">Loading player...</div>
  }
)

type ContentDetailClientProps = {
  workspaceId: string
  content: Content
  processed: ProcessedContent | null
  quizzes: Quiz[]
  flashcards: Flashcard[]
  videoTitle?: string | null
  initialChatMessages?: any[]
  chatSessionId?: string
}

type TranscriptLine = {
  timestamp: string
  text: string
}

function parseTimestampToSeconds(timestamp: string): number | null {
  if (!timestamp) return null
  const parts = timestamp.split(":").map((p) => parseInt(p, 10))
  if (parts.some((n) => Number.isNaN(n))) return null

  if (parts.length === 3) {
    const [h, m, s] = parts
    return h * 3600 + m * 60 + s
  }
  if (parts.length === 2) {
    const [m, s] = parts
    return m * 60 + s
  }
  return null
}

function linkifyTimestamps(markdown: string): string {
  return markdown.replace(
    /\[(\d{1,2}:\d{2}(?::\d{2})?)\]/g,
    (_match, ts) => `[${ts}](timestamp:${ts})`
  )
}

function removeTimestamps(text: string): string {
  // Remove timestamps in format [MM:SS] or [HH:MM:SS]
  return text.replace(/\[\d{1,2}:\d{2}(?::\d{2})?\]/g, '').trim()
}

function normalizeSummary(summary: ProcessedContent["summary"]): string {
  if (!summary) return ""
  if (typeof summary === "string") {
    const trimmed = summary.trim()
    // If it looks like JSON, try to parse it
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed)
        // If parsed successfully and it's an object, convert to markdown
        if (typeof parsed === "object" && parsed !== null) {
          const lines: string[] = []
          if (parsed.overview) {
            lines.push(parsed.overview, "")
          }
          if (Array.isArray(parsed.keyTakeaways) && parsed.keyTakeaways.length > 0) {
            lines.push("## Key Takeaways", "")
            for (const k of parsed.keyTakeaways) lines.push(`- ${k}`)
            lines.push("")
          }
          if (Array.isArray(parsed.concepts) && parsed.concepts.length > 0) {
            lines.push("## Important Concepts", "")
            for (const c of parsed.concepts) lines.push(`- ${c}`)
            lines.push("")
          }
          if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
            lines.push("## Questions to Think About", "")
            for (const q of parsed.questions) lines.push(`- ${q}`)
          }
          return lines.join("\n")
        }
      } catch {
        // If parsing fails, return the string as-is
      }
    }
    return trimmed
  }
  // legacy object-style summaries – very simple conversion
  const obj: any = summary
  const lines: string[] = []
  if (obj.overview) {
    lines.push(obj.overview, "")
  }
  if (Array.isArray(obj.keyTakeaways) && obj.keyTakeaways.length > 0) {
    lines.push("## Key Takeaways", "")
    for (const k of obj.keyTakeaways) lines.push(`- ${k}`)
    lines.push("")
  }
  if (Array.isArray(obj.concepts) && obj.concepts.length > 0) {
    lines.push("## Important Concepts", "")
    for (const c of obj.concepts) lines.push(`- ${c}`)
    lines.push("")
  }
  if (Array.isArray(obj.questions) && obj.questions.length > 0) {
    lines.push("## Questions to Think About", "")
    for (const q of obj.questions) lines.push(`- ${q}`)
  }
  return lines.join("\n")
}

export default function ContentDetailClient({
  workspaceId,
  content,
  processed,
  quizzes,
  flashcards,
  videoTitle,
  initialChatMessages = [],
  chatSessionId,
}: ContentDetailClientProps) {
  const playerRef = useRef<any>(null)
  const [playerReady, setPlayerReady] = useState(false)
  const [processedData, setProcessedData] = useState<ProcessedContent | null>(processed)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("chat")
  const summaryScrollRef = useRef<HTMLDivElement>(null)
  const flashcardsScrollRef = useRef<HTMLDivElement>(null)
  const quizScrollRef = useRef<HTMLDivElement>(null)
  
  // Text selection state
  const [selectedText, setSelectedText] = useState("")
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null)
  const [chatInputValue, setChatInputValue] = useState<string | null>(null)
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [previousTab, setPreviousTab] = useState<string | null>(null)

  // Track tab changes for smooth transitions
  useEffect(() => {
    setPreviousTab(activeTab)
  }, [activeTab])

  // Reset scroll position when switching tabs
  useEffect(() => {
    if (activeTab === "summary" && summaryScrollRef.current) {
      summaryScrollRef.current.scrollTop = 0
    } else if (activeTab === "flashcards" && flashcardsScrollRef.current) {
      flashcardsScrollRef.current.scrollTop = 0
    } else if (activeTab === "quiz" && quizScrollRef.current) {
      quizScrollRef.current.scrollTop = 0
    }
  }, [activeTab])

  const isYouTube = content.type === "youtube"

  const transcriptLines: TranscriptLine[] = useMemo(() => {
    if (!processedData?.chunks || !Array.isArray(processedData.chunks)) return []
    // Only include timestamps for YouTube videos
    return processedData.chunks
      .filter((chunk: any) => typeof chunk.text === "string" && chunk.text.trim().length > 0)
      .map((chunk: any) => ({
        timestamp: isYouTube && chunk.metadata?.timestamp ? chunk.metadata.timestamp : "",
        text: chunk.text as string,
      }))
  }, [processedData, isYouTube])

  const handleSeekToTimestamp = useCallback((timestamp: string) => {
    const seconds = parseTimestampToSeconds(timestamp)
    console.log("Seeking to timestamp:", timestamp, "seconds:", seconds)
    
    if (seconds == null) {
      console.warn("Invalid timestamp:", timestamp)
      return
    }

    const seek = () => {
      const player = playerRef.current
      if (!player) {
        console.warn("Player instance not available")
        return false
      }

      try {
        // Method 1: ReactPlayer's seekTo method (most reliable)
        if (typeof player.seekTo === "function") {
          console.log("Using ReactPlayer.seekTo method, seeking to:", seconds)
          player.seekTo(seconds, 'seconds')
          // Also try to play if paused
          if (typeof player.getInternalPlayer === "function") {
            try {
              const internalPlayer = player.getInternalPlayer("youtube")
              if (internalPlayer) {
                // Ensure video is playing
                if (typeof internalPlayer.playVideo === "function") {
                  internalPlayer.playVideo()
                }
              }
            } catch (e) {
              // Ignore errors
            }
          }
          return true
        }

        // Method 2: Get internal YouTube player and use its seekTo
        if (typeof player.getInternalPlayer === "function") {
          try {
            const internalPlayer = player.getInternalPlayer("youtube")
            if (internalPlayer && typeof internalPlayer.seekTo === "function") {
              console.log("Using YouTube internal player.seekTo, seeking to:", seconds)
              internalPlayer.seekTo(seconds, true)
              // Play the video
              if (typeof internalPlayer.playVideo === "function") {
                internalPlayer.playVideo()
              }
              return true
            }
          } catch (e) {
            // Try without parameter
            try {
              const internalPlayer = player.getInternalPlayer()
              if (internalPlayer && typeof internalPlayer.seekTo === "function") {
                console.log("Using internal player.seekTo (no param), seeking to:", seconds)
                internalPlayer.seekTo(seconds, true)
                if (typeof internalPlayer.playVideo === "function") {
                  internalPlayer.playVideo()
                }
                return true
              }
            } catch (e2) {
              console.warn("Could not get internal player:", e2)
            }
          }
        }

        console.warn("Could not find seekTo method on player")
        return false
      } catch (error) {
        console.error("Error seeking to timestamp:", error)
        return false
      }
    }

    // Try immediately
    if (playerReady && playerRef.current) {
      if (seek()) {
        return
      }
    }

    // If player not ready, wait and retry
    let retries = 0
    const maxRetries = 10
    const retryInterval = 300

    const retrySeek = () => {
      if (retries >= maxRetries) {
        console.warn("Max retries reached, could not seek to timestamp")
        return
      }

      retries++
      setTimeout(() => {
        if (playerRef.current) {
          if (seek()) {
            return
          }
        }
        // Continue retrying if not successful
        if (retries < maxRetries) {
          retrySeek()
        }
      }, retryInterval)
    }

    retrySeek()
  }, [playerReady])

  // Track if we've already triggered summary generation (use ref to avoid race conditions)
  const summaryTriggeredRef = useRef(false)
  
  // Trigger summary generation if content is ready but no summary exists
  const triggerSummaryGeneration = useCallback(async () => {
    // Use ref to prevent duplicate calls (state updates are async)
    if (summaryTriggeredRef.current) return
    summaryTriggeredRef.current = true
    
    console.log("[ContentDetail] Triggering summary generation for content:", content.id)
    try {
      const response = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId: content.id }),
      })
      if (response.ok) {
        console.log("[ContentDetail] Summary generation triggered successfully")
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error("[ContentDetail] Summary generation failed:", errorData.error || response.statusText)
        // Reset ref on failure so it can be retried
        summaryTriggeredRef.current = false
      }
    } catch (error) {
      console.error("[ContentDetail] Error triggering summary:", error)
      summaryTriggeredRef.current = false
    }
  }, [content.id])
  
  // Auto-refresh processed content to check for summary updates
  const refreshProcessedContent = useCallback(async () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    try {
      const response = await fetch(`/api/content/${content.id}/processed`, {
        method: "GET",
        cache: "no-store",
      })
      if (response.ok) {
        const data = await response.json()
        if (data.processed) {
          // Check if summary exists
          const summaryExists = data.processed.summary && 
            typeof data.processed.summary === 'string' && 
            data.processed.summary.trim().length > 0
          
          if (summaryExists) {
            console.log(`[ContentDetail] Summary received! Length: ${data.processed.summary.length}`)
          }
          
          setProcessedData(data.processed)
        }
      }
    } catch (error) {
      console.error("Error refreshing processed content:", error)
    } finally {
      setIsRefreshing(false)
    }
  }, [content.id, isRefreshing])

  // Auto-refresh if summary is not available yet
  useEffect(() => {
    const summary = processedData?.summary
    const hasSummary = summary && 
      typeof summary === 'string' && 
      summary.trim().length > 0
    
    // If summary exists, stop polling
    if (hasSummary && summary) {
      console.log("[ContentDetail] Summary available, no polling needed. Length:", summary.length)
      return
    }
    
    console.log("[ContentDetail] No summary yet, starting polling for content:", content.id)
    
    // Trigger summary generation once if content is ready/partial but no summary
    if ((content.status === "ready" || content.status === "partial") && !summaryTriggeredRef.current) {
      triggerSummaryGeneration()
    }
    
    // Poll for updates
    const intervalId = setInterval(() => {
      refreshProcessedContent()
    }, 2000)
    
    // Stop polling after 2 minutes
    const timeoutId = setTimeout(() => {
      console.log("[ContentDetail] Stopping summary polling after timeout")
      clearInterval(intervalId)
    }, 120000)
    
    return () => {
      clearInterval(intervalId)
      clearTimeout(timeoutId)
    }
  }, [processedData?.summary, content.id, content.status, triggerSummaryGeneration, refreshProcessedContent])

  // Handle text selection
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.toString().trim().length === 0) {
      setSelectionPosition(null)
      setSelectedText("")
      return
    }

    const text = selection.toString().trim()
    if (text.length < 3) {
      setSelectionPosition(null)
      setSelectedText("")
      return
    }

    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    
    setSelectedText(text)
    setSelectionPosition({
      x: rect.left + rect.width / 2,
      y: rect.top,
    })
  }, [])

  // Handle popup actions
  const handleChatAction = useCallback(() => {
    if (selectedText) {
      setActiveTab("chat")
      // Add quotes around selected text for better formatting
      const chatText = `"${selectedText}"`
      setChatInputValue(chatText)
      setSelectionPosition(null)
      setSelectedText("")
      // Clear selection highlight
      window.getSelection()?.removeAllRanges()
    }
  }, [selectedText])

  const handleExplainAction = useCallback(() => {
    if (selectedText) {
      setActiveTab("chat")
      // Format like YouLearn: "Explain: [selected text]"
      const explainText = `Explain: "${selectedText}"`
      setChatInputValue(explainText)
      setSelectionPosition(null)
      setSelectedText("")
      // Clear selection highlight
      window.getSelection()?.removeAllRanges()
    }
  }, [selectedText])

  const handleQuizAction = useCallback(() => {
    if (selectedText) {
      setActiveTab("quiz")
      // TODO: Could pre-fill quiz generation with selected text context
      setSelectionPosition(null)
      setSelectedText("")
    }
  }, [selectedText])

  const handleFlashcardsAction = useCallback(() => {
    if (selectedText) {
      setActiveTab("flashcards")
      // TODO: Could pre-fill flashcard generation with selected text context
      setSelectionPosition(null)
      setSelectedText("")
    }
  }, [selectedText])

  // Clear selection when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (selectionPosition) {
        // Don't clear if clicking on the popup itself
        const target = e.target as HTMLElement
        if (target.closest('.text-selection-popup')) {
          return
        }
        setSelectionPosition(null)
        setSelectedText("")
        window.getSelection()?.removeAllRanges()
      }
    }

    if (selectionPosition) {
      // Small delay to allow popup click to register
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
      }, 100)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [selectionPosition])

  // Track chat messages state to ensure persistence
  const [chatMessages, setChatMessages] = useState(initialChatMessages)
  const chatMessagesRef = useRef(initialChatMessages)
  
  // Update chat messages when initialChatMessages changes (from server)
  useEffect(() => {
    if (Array.isArray(initialChatMessages)) {
      // Always update if we have messages from server (they're the source of truth)
      if (initialChatMessages.length > 0) {
        setChatMessages(initialChatMessages)
        chatMessagesRef.current = initialChatMessages
      } else if (initialChatMessages.length === 0 && chatMessages.length === 0) {
        // Both empty - keep empty state
        chatMessagesRef.current = []
      }
    }
  }, [initialChatMessages])
  
  // Refresh chat messages when switching to chat tab
  useEffect(() => {
    if (activeTab === "chat" && content.id) {
      refreshChatHistory()
    }
  }, [activeTab, content.id])
  
  const refreshChatHistory = useCallback(async () => {
    if (!content.id) return
    
    try {
      // Fetch latest messages from server
      const response = await fetch(`/api/content/${content.id}/chat-messages`, {
        method: "GET",
        cache: "no-store",
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.messages && Array.isArray(data.messages)) {
          // Update chat messages state with fresh data from server
          // Server is the source of truth for persisted messages
          setChatMessages(data.messages)
          chatMessagesRef.current = data.messages
          console.log(`[Chat] Refreshed ${data.messages.length} messages from server`)
        }
      } else {
        console.warn(`[Chat] Failed to refresh messages: ${response.status}`)
      }
    } catch (error) {
      console.error("Error refreshing chat history:", error)
    }
  }, [content.id])

  const normalizedSummary = useMemo(() => {
    const summary = normalizeSummary(processedData?.summary ?? null)
    // Remove timestamps from summary (don't linkify them)
    return removeTimestamps(summary)
  }, [processedData])

  const metadata = content.metadata && typeof content.metadata === "object" ? (content.metadata as any) : null
  
  // State for live title (from polling/re-classification)
  const [liveTitle, setLiveTitle] = useState<string | null>(null)
  const [liveMetadata, setLiveMetadata] = useState<any>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const pollCountRef = useRef(0)
  const classifyAttemptedRef = useRef(false)
  
  // Generic/fallback titles that need polling
  const GENERIC_TITLES = ['CONTENT', 'PROCESSING…', 'PROCESSING', 'PDF DOCUMENT', 'UNTITLED CONTENT', 'YOUTUBE VIDEO']
  
  // Common words/patterns that shouldn't be titles - trigger re-classification
  const SUSPICIOUS_TITLES = [
    // Section headings
    'INTRODUCTION', 'I. INTRODUCTION', 'I INTRODUCTION', '1. INTRODUCTION', '1 INTRODUCTION',
    'ABSTRACT', 'METHODOLOGY', 'METHODS', 'RESULTS', 'DISCUSSION', 'CONCLUSION', 'CONCLUSIONS',
    'REFERENCES', 'BIBLIOGRAPHY', 'ACKNOWLEDGMENTS', 'ACKNOWLEDGEMENTS',
    // Chapter/section markers
    'CHAPTER', 'SECTION', 'UNIT', 'PART',
    // Common nouns
    'LOCKERS', 'LOCKER', 'PERSON', 'PEOPLE', 'NUMBER', 'NUMBERS',
    'QUEEN', 'KING', 'MINISTER', 'PUZZLE', 'PROBLEM', 'ANSWER',
    'EXERCISE', 'EXERCISES', 'PROBLEMS', 'SOLUTIONS', 'ANSWERS',
  ]
  
  // Check if title looks like a section heading
  const isSectionHeading = (title: string): boolean => {
    const normalized = title.trim().toUpperCase()
    // Check for Roman numeral patterns
    if (/^(I{1,3}|IV|VI{0,3}|IX|X{1,3})\.?\s+/i.test(normalized)) return true
    // Check for numbered patterns
    if (/^\d+\.?\s+(INTRODUCTION|ABSTRACT|METHODS|RESULTS|DISCUSSION|CONCLUSION)/i.test(normalized)) return true
    return false
  }
  
  // Poll for title updates when content has a generic/processing title
  useEffect(() => {
    const currentTitle = (liveTitle || metadata?.display_title || content.title || "").trim()
    const currentTitleUpper = currentTitle.toUpperCase()
    
    const needsPolling = () => {
      // Poll if title is generic/fallback
      if (GENERIC_TITLES.includes(currentTitleUpper)) return true
      // Poll if still processing
      if (content.status === "processing") return true
      // Poll if title looks like a section heading (e.g., "I. INTRODUCTION")
      if (isSectionHeading(currentTitle)) return true
      // Poll if it's a suspicious word
      if (SUSPICIOUS_TITLES.includes(currentTitleUpper)) return true
      // Poll if title matches suspicious pattern without prefix
      const withoutPrefix = currentTitleUpper.replace(/^(I{1,3}|IV|VI{0,3}|IX|X{1,3}|\d+)\.?\s*/i, '')
      if (SUSPICIOUS_TITLES.includes(withoutPrefix)) return true
      return false
    }
    
    // Poll up to 15 times (about 30 seconds total)
    if (needsPolling() && pollCountRef.current < 15) {
      const delay = Math.min(1000 + pollCountRef.current * 500, 3000) // 1s, 1.5s, 2s, ... up to 3s
      
      pollingRef.current = setTimeout(async () => {
        try {
          console.log(`[ContentDetailClient] Polling for title update (attempt ${pollCountRef.current + 1})`)
          const response = await fetch(`/api/content/${content.id}/processed`)
          if (response.ok) {
            const data = await response.json()
            if (data.content) {
              const newTitle = data.content.title
              const newMetadata = data.content.metadata
              
              // Check if we got a better title
              if (newTitle && !GENERIC_TITLES.includes(newTitle.toUpperCase().trim())) {
                console.log(`[ContentDetailClient] Got updated title: "${newTitle}"`)
                setLiveTitle(newTitle)
                if (newMetadata) {
                  setLiveMetadata(newMetadata)
                }
              } else if (newMetadata?.display_title && 
                         !GENERIC_TITLES.includes(newMetadata.display_title.toUpperCase().trim())) {
                console.log(`[ContentDetailClient] Got updated display_title: "${newMetadata.display_title}"`)
                setLiveTitle(newMetadata.display_title)
                setLiveMetadata(newMetadata)
              }
            }
          }
        } catch (err) {
          console.warn("Polling for title failed:", err)
        }
        pollCountRef.current++
      }, delay)
    }
    
    return () => {
      if (pollingRef.current) {
        clearTimeout(pollingRef.current)
      }
    }
  }, [content.id, content.status, content.title, metadata?.display_title, liveTitle])
  
  // Auto-trigger re-classification for PDFs with suspicious titles (after polling fails)
  useEffect(() => {
    const shouldReclassify = () => {
      if (content.type !== "pdf") return false
      if (classifyAttemptedRef.current) return false
      if (pollCountRef.current < 5) return false // Wait for some polling first
      
      const currentTitle = (liveTitle || metadata?.display_title || content.title || "").trim()
      const currentTitleUpper = currentTitle.toUpperCase()
      
      // Check if title looks like a section heading
      if (isSectionHeading(currentTitle)) return true
      
      // Check if it's a suspicious title
      if (SUSPICIOUS_TITLES.includes(currentTitleUpper)) return true
      
      // Check without prefix
      const withoutPrefix = currentTitleUpper.replace(/^(I{1,3}|IV|VI{0,3}|IX|X{1,3}|\d+)\.?\s*/i, '')
      if (SUSPICIOUS_TITLES.includes(withoutPrefix)) return true
      
      return false
    }
    
    if (shouldReclassify()) {
      classifyAttemptedRef.current = true
      console.log(`[ContentDetailClient] Triggering re-classification for suspicious title`)
      
      fetch(`/api/content/${content.id}/classify`, {
        method: "POST",
      })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json()
            if (data.classification?.display_title) {
              console.log(`[ContentDetailClient] Got better title: "${data.classification.display_title}"`)
              setLiveTitle(data.classification.display_title)
            }
          }
        })
        .catch((err) => {
          console.warn("Re-classification failed:", err)
        })
    }
  }, [content.id, content.type, content.title, metadata?.display_title, liveTitle])
  
  // Use live metadata if available, otherwise fall back to props
  const effectiveMetadata = liveMetadata || metadata
  
  // Prioritize metadata title for YouTube (fetched from API), then database title
  const contentTitle = useMemo(() => {
    // Use live title from polling/re-classification if available
    if (liveTitle) {
      return liveTitle
    }
    // For PDFs, prioritize display_title from metadata (extracted from PDF content)
    if (content.type === "pdf") {
      // First check display_title from effective metadata (includes live updates)
      if (effectiveMetadata?.display_title && 
          effectiveMetadata.display_title !== "Processing…" &&
          effectiveMetadata.display_title !== "Untitled Content" &&
          effectiveMetadata.display_title !== "Content" &&
          !effectiveMetadata.display_title.includes("D:\\") && // Exclude file paths
          !effectiveMetadata.display_title.includes("/")) {
        return effectiveMetadata.display_title
      }
      
      // Check chapter info from metadata
      if (effectiveMetadata?.chapter_number && effectiveMetadata?.chapter) {
        const chapterName = effectiveMetadata.chapter
          .split(' ')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ')
        return `Chapter ${effectiveMetadata.chapter_number} — ${chapterName}`
      }
      
      // Try to extract from content title (database field)
      if (content.title && 
          content.title !== "Processing…" && 
          content.title !== "Untitled Content" &&
          content.title !== "Content" &&
          !content.title.includes("D:\\") &&
          !content.title.includes("/")) {
        return content.title
      }
      
      // Try PDF metadata Title (but clean it)
      if (effectiveMetadata?.info?.Title) {
        let cleanTitle = effectiveMetadata.info.Title.trim()
        // Remove file paths
        if (cleanTitle.includes('\\') || cleanTitle.includes('/')) {
          cleanTitle = cleanTitle.split(/[\\\/]/).pop() || cleanTitle
        }
        // Remove extensions
        cleanTitle = cleanTitle.replace(/\.(pmd|pdf)$/i, '')
        if (cleanTitle && cleanTitle.length > 3) {
          return cleanTitle
        }
      }
    }
    
    // For YouTube, prefer metadata.title as it's from YouTube API
    if (effectiveMetadata?.title && effectiveMetadata.title !== "YouTube Video") {
      return effectiveMetadata.title
    }
    
    // Check database title (exclude generic fallbacks)
    if (content.title && 
        content.title !== "Processing…" && 
        content.title !== "Untitled Content" && 
        content.title !== "YouTube Video") {
      return content.title
    }
    
    // Other fallbacks
    return videoTitle || effectiveMetadata?.display_title || "Content"
  }, [content.title, content.type, effectiveMetadata, videoTitle, liveTitle, liveMetadata])
  const contextSubject = metadata?.subject || null
  const contextGrade = metadata?.grade ?? null
  const [showChatMobile, setShowChatMobile] = useState(true)

  // Set up global callbacks for tab switching from chat suggestions
  useEffect(() => {
    (window as any).onSwitchToQuizTab = () => {
      setActiveTab('quiz')
    }
    ;(window as any).onSwitchToFlashcardsTab = () => {
      setActiveTab('flashcards')
    }
    
    return () => {
      delete (window as any).onSwitchToQuizTab
      delete (window as any).onSwitchToFlashcardsTab
    }
  }, [])

  const channelTitle =
    content.metadata && typeof content.metadata === "object"
      ? (content.metadata as any).channelTitle || ""
      : ""

  // Fetch PDF signed URL when content is PDF
  useEffect(() => {
    if (content.type === "pdf" && !pdfUrl && !pdfLoading) {
      setPdfLoading(true)
      console.log(`[ContentDetail] Fetching PDF URL for content: ${content.id}`)
      
      fetch(`/api/content/${content.id}/pdf-url`)
        .then((res) => {
          if (!res.ok) {
            return res.json().then((errorData) => {
              throw new Error(errorData.error || errorData.message || `HTTP ${res.status}`)
            })
          }
          return res.json()
        })
        .then((data) => {
          console.log(`[ContentDetail] PDF URL response:`, data)
          
          // Handle both 'url' and 'pdfUrl' response formats
          const url = data.pdfUrl || data.url
          
          if (url) {
            setPdfUrl(url)
            console.log(`[ContentDetail] PDF URL set successfully`)
          } else {
            console.error("[ContentDetail] No URL in response:", data)
            throw new Error("No PDF URL in response")
          }
        })
        .catch((error) => {
          console.error("[ContentDetail] Error fetching PDF URL:", error)
          // Don't set error state - let PDFViewer handle the error display
        })
        .finally(() => {
          setPdfLoading(false)
        })
    }
  }, [content.type, content.id]) // Removed pdfUrl and pdfLoading from dependencies to prevent infinite loop

  return (
    <div className="bg-gray-50" style={{ fontFamily: "Inter, sans-serif" }}>
      <style jsx global>{`
        .select-text ::selection {
          background-color: #dbeafe;
          color: #1e3a8a;
        }
        .select-text ::-moz-selection {
          background-color: #dbeafe;
          color: #1e3a8a;
        }
      `}</style>
      <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Title Section - Always visible immediately below navbar */}
        <div className="pt-2 sm:pt-3 pb-2 sm:pb-3 space-y-1 sm:space-y-1.5">
          {/* Navigation Button */}
          <div className="flex items-center gap-2 mb-2">
            <Link href="/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-[#EFA07F] hover:bg-[#EFA07F]/10 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </Link>
          </div>
          
          <div className="flex items-start gap-2 sm:gap-3 flex-wrap">
            <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-[#1e3a8a] flex-1 min-w-0 break-words leading-tight">
              {contentTitle}
            </h1>
            {content.status === "processing" && (
              <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                Processing
              </span>
            )}
            {content.status === "partial" && (
              <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
                Partial
              </span>
            )}
            {content.type === "pdf" && (content.metadata as any)?.document_type && (
              <span className="px-2 py-0.5 text-xs font-medium bg-blue-50 text-[#1e3a8a] rounded-full">
                {(content.metadata as any).document_type}
              </span>
            )}
          </div>
          {channelTitle && (
            <p className="text-xs sm:text-sm text-gray-500">{channelTitle}</p>
          )}
          {content.type === "pdf" && (content.metadata as any)?.subject && (
            <p className="text-xs sm:text-sm text-gray-500">
              {(content.metadata as any).subject}
              {(content.metadata as any)?.grade && ` • Grade ${(content.metadata as any).grade}`}
            </p>
          )}
        </div>

        {/* Main grid - content aware layout with focus mode support */}
        <div className={cn(
          "grid gap-0 items-stretch lg:h-[calc(100vh-180px)] xl:h-[calc(100vh-175px)] min-h-[500px] sm:min-h-[600px] md:min-h-[650px] border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm relative mb-3 sm:mb-4 md:mb-6",
          isFocusMode ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-[50%_50%]"
        )}>
          {/* Left column */}
          <div className="flex flex-col h-full border-b lg:border-b-0 lg:border-r border-gray-200 bg-[#f9fafb] min-h-[400px] sm:min-h-[450px] md:min-h-[500px]">
            <div
              className={
                isYouTube && content.raw_url
                  ? "h-[40%] min-h-[250px] sm:min-h-[280px] md:min-h-[300px] flex items-center justify-center bg-black flex-shrink-0"
                  : content.type === "pdf"
                  ? "h-full flex-1 min-h-0"
                  : "h-[40%] min-h-[200px] sm:min-h-[250px] flex items-center justify-center bg-gray-50 flex-shrink-0"
              }
            >
                  {isYouTube && content.raw_url ? (
                    <ReactPlayer
                      ref={(instance: any) => {
                        if (instance) {
                          console.log("Player instance set", instance)
                          playerRef.current = instance
                          // Mark as ready when instance is available
                          setPlayerReady(true)
                        }
                      }}
                      url={content.raw_url}
                      width="100%"
                      height="100%"
                      controls
                      playing={false}
                      onReady={() => {
                        console.log("Player ready")
                        setPlayerReady(true)
                      }}
                      onStart={() => {
                        console.log("Player started")
                        setPlayerReady(true)
                      }}
                      onPlay={() => {
                        console.log("Player playing")
                        setPlayerReady(true)
                      }}
                      config={{
                        youtube: {
                          playerVars: {
                            enablejsapi: 1,
                            origin: typeof window !== 'undefined' ? window.location.origin : '',
                          },
                        },
                      }}
                    />
                    ) : content.type === "pdf" ? (
                    pdfUrl ? (
                      <PDFViewer url={pdfUrl} className="w-full h-full" />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full bg-[#f9fafb]">
                        <div className="w-16 h-16 border-4 border-[#1e3a8a] border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-sm text-gray-600 font-medium">Preparing document...</p>
                      </div>
                    )
                  ) : content.type === "text" ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <FileText className="h-24 w-24 text-[#1e3a8a]" />
                      <p className="mt-4 text-sm text-slate-600 font-medium">Text Content</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <File className="h-24 w-24 text-slate-400" />
                      <p className="mt-4 text-sm text-slate-600 font-medium capitalize">{content.type}</p>
                    </div>
                  )}
            </div>

            {/* Transcript / document content (hidden for PDFs because full doc is shown above) */}
            {content.type !== "pdf" && (
              <Card className="m-2 sm:m-3 md:m-4 flex-1 min-h-0 flex flex-col border-0 shadow-none bg-transparent">
                <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4 md:px-5 flex-shrink-0 border-b border-gray-100">
                  <CardTitle className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">
                    {isYouTube ? "Transcript" : "Document Content"}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm hidden sm:block text-gray-500 mt-1">
                    {isYouTube
                      ? "Full transcript of the video content."
                      : "Full content extracted from this document."}
                  </CardDescription>
                </CardHeader>
                <CardContent 
                  className="pt-3 sm:pt-4 px-3 sm:px-4 md:px-5 flex-1 min-h-0 overflow-y-auto select-text"
                  onMouseUp={handleTextSelection}
                >
                  {transcriptLines.length > 0 ? (
                    <div className="space-y-2.5">
                      {transcriptLines.map((line, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "text-sm leading-relaxed",
                            isYouTube ? "flex items-start gap-2.5" : "text-slate-700"
                          )}
                        >
                          {isYouTube && line.timestamp ? (
                            <>
                              <span className="flex-shrink-0 font-mono text-xs text-gray-400 select-none">
                                {line.timestamp}
                              </span>
                              <span className="text-slate-700 flex-1">{line.text}</span>
                            </>
                          ) : (
                            <span className="text-slate-700">{line.text}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : content.extracted_text ? (
                    <div className="prose prose-sm max-w-none">
                      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {content.extracted_text}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 text-center py-8">
                      No content available yet for this document.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right column: Chat panel - 50% width, sticky tabs */}
          <div
            className={cn(
              "flex flex-col h-full min-h-0 bg-white",
              "lg:block",
              showChatMobile ? "block" : "hidden"
            )}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
              {/* Sticky tab bar - optimized spacing */}
              <div className="flex items-center justify-between border-b border-gray-200 px-3 sm:px-4 md:px-5 h-12 sm:h-14 bg-white sticky top-0 z-10 overflow-x-auto shadow-sm">
                <TabsList className="h-auto p-0 bg-transparent border-0 gap-0.5 sm:gap-1 flex-shrink-0">
                  <TabsTrigger value="chat" className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-600 hover:text-[#1e3a8a] data-[state=active]:text-[#1e3a8a] data-[state=active]:bg-blue-50 rounded-lg bg-transparent transition-colors relative">
                    <span className="relative flex items-center gap-1.5 sm:gap-2">
                      {activeTab === "chat" && <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#1e3a8a] rounded-full" />}
                      <span>Chat</span>
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="summary" className="px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-600 hover:text-[#1e3a8a] data-[state=active]:text-[#1e3a8a] data-[state=active]:bg-blue-50 rounded-lg bg-transparent transition-colors relative min-h-[44px] touch-manipulation">
                    <span className="relative flex items-center gap-1.5 sm:gap-2">
                      {activeTab === "summary" && <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#1e3a8a] rounded-full" />}
                      <span>Summary</span>
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="flashcards" className="px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-600 hover:text-[#1e3a8a] data-[state=active]:text-[#1e3a8a] data-[state=active]:bg-blue-50 rounded-lg bg-transparent transition-colors relative min-h-[44px] touch-manipulation">
                    <span className="relative flex items-center gap-1.5 sm:gap-2">
                      {activeTab === "flashcards" && <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#1e3a8a] rounded-full" />}
                      <span className="hidden sm:inline">Flashcards</span>
                      <span className="sm:hidden">Cards</span>
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="quiz" className="px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-600 hover:text-[#1e3a8a] data-[state=active]:text-[#1e3a8a] data-[state=active]:bg-blue-50 rounded-lg bg-transparent transition-colors relative min-h-[44px] touch-manipulation">
                    <span className="relative flex items-center gap-1.5 sm:gap-2">
                      {activeTab === "quiz" && <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#1e3a8a] rounded-full" />}
                      <span className="hidden xs:inline">Quizzes</span>
                      <span className="xs:hidden">Quiz</span>
                    </span>
                  </TabsTrigger>
                </TabsList>
                
                {/* Focus Mode Toggle Button - Desktop only */}
                <div className="hidden lg:flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsFocusMode(!isFocusMode)}
                    className="text-gray-600 hover:text-[#EFA07F] hover:bg-[#EFA07F]/10 transition-colors"
                    title={isFocusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
                  >
                    {isFocusMode ? (
                      <>
                        <Minimize2 className="h-4 w-4 mr-1.5" />
                        <span className="hidden sm:inline">Split View</span>
                      </>
                    ) : (
                      <>
                        <Maximize2 className="h-4 w-4 mr-1.5" />
                        <span className="hidden sm:inline">Focus Mode</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <TabsContent value="chat" className={cn("flex-1 min-h-0 m-0", previousTab && previousTab !== activeTab && previousTab === "chat" && "tab-content-enter")}>
                <ChatInterface
                  workspaceId={workspaceId}
                  contentId={content.id}
                  contentType={content.type}
                  onTimestampClick={isYouTube ? handleSeekToTimestamp : undefined}
                  initialMessages={chatMessages}
                  chatSessionId={chatSessionId}
                  contextTitle={contentTitle}
                  contextSubject={contextSubject}
                  contextGrade={contextGrade}
                  setInputValue={chatInputValue}
                  onInputValueSet={() => setChatInputValue(null)}
                />
              </TabsContent>

              <TabsContent value="summary" className={cn("flex-1 min-h-0 overflow-y-auto m-0", previousTab && previousTab !== activeTab && previousTab === "summary" && "tab-content-enter")}>
                <div 
                  ref={summaryScrollRef} 
                  className="h-full overflow-y-auto px-4 py-6 select-text"
                  onMouseUp={handleTextSelection}
                >
                  <div className="max-w-3xl mx-auto">
                    {normalizedSummary ? (
                      <div className="prose prose-sm max-w-none text-gray-800">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed text-sm text-gray-800">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc list-outside ml-5 mb-3 space-y-1.5 text-sm text-gray-800">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal list-outside ml-5 mb-3 space-y-1.5 text-sm text-gray-800">{children}</ol>,
                            li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                            strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                            h1: ({ children }) => <h1 className="text-lg font-bold mb-3 mt-6 first:mt-0 text-gray-900">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-base font-semibold mb-2 mt-5 first:mt-0 text-gray-900">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-sm font-semibold mb-2 mt-4 first:mt-0 text-gray-800">{children}</h3>,
                            a: ({ href, children }) => (
                              <a href={href} className="text-[#1e3a8a] hover:underline">
                                {children}
                              </a>
                            ),
                          }}
                        >
                          {normalizedSummary}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        {content.status === "processing" || content.status === "ready" ? (
                          <>
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#1e3a8a] border-t-transparent mb-4"></div>
                            <p className="text-sm text-gray-600 font-medium">Generating summary...</p>
                            <p className="text-xs text-gray-400 mt-1">This may take a moment</p>
                          </>
                        ) : (
                          <p className="text-sm text-gray-500">
                            No summary available yet.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="flashcards" className={cn("flex-1 min-h-0 overflow-hidden m-0", previousTab && previousTab !== activeTab && previousTab === "flashcards" && "tab-content-enter")}>
                <div ref={flashcardsScrollRef} className="h-full overflow-y-auto">
                  <FlashcardsInterface
                    workspaceId={workspaceId}
                    existingFlashcards={flashcards.filter(
                      (f) => !f.content_id || f.content_id === content.id
                    )}
                    contentId={content.id}
                  />
                </div>
              </TabsContent>

              <TabsContent value="quiz" className={cn("flex-1 min-h-0 overflow-hidden m-0", previousTab && previousTab !== activeTab && previousTab === "quiz" && "tab-content-enter")}>
                <div ref={quizScrollRef} className="h-full overflow-y-auto">
                  <QuizInterface
                    workspaceId={workspaceId}
                    existingQuizzes={quizzes.filter(
                      (q) => !q.content_id || q.content_id === content.id
                    )}
                    contentId={content.id}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Floating Ask AI button for mobile */}
        <div className="lg:hidden fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-20">
          <Button
            onClick={() => setShowChatMobile((prev) => !prev)}
            className="rounded-full shadow-lg px-5 py-3 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm sm:text-base font-medium min-h-[44px] min-w-[44px] touch-manipulation"
          >
            {showChatMobile ? "Close" : "Ask AI"}
          </Button>
        </div>

        {/* Text Selection Popup */}
        {selectionPosition && selectedText && (
          <TextSelectionPopup
            selectedText={selectedText}
            position={selectionPosition}
            onChat={handleChatAction}
            onExplain={handleExplainAction}
            onQuiz={handleQuizAction}
            onFlashcards={handleFlashcardsAction}
          />
        )}
      </div>
    </div>
  )
}



