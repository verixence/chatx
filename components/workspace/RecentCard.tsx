"use client"

import { useState, useEffect, memo, useMemo, useRef, useCallback } from "react"
import Link from "next/link"
import { File, FileText, Youtube, Music, Play, Check } from "lucide-react"
import { cn } from "@/lib/utils/cn"

// Thumbnail cache key prefix
const THUMBNAIL_CACHE_PREFIX = "lc_thumb_"
const THUMBNAIL_CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000 // 7 days

interface RecentCardProps {
  content: {
    id: string
    type: "pdf" | "youtube" | "text" | "audio" | "video"
    raw_url?: string | null
    metadata?: any
    created_at: string
    workspace_id: string
    title: string // Content title from database
    status?: "processing" | "ready" | "partial"
  }
  workspaceName: string
  selectionMode?: boolean
  isSelected?: boolean
  onToggleSelect?: () => void
}

// Helper to get cached thumbnail
function getCachedThumbnail(contentId: string): string | null {
  if (typeof window === "undefined") return null
  try {
    const cached = localStorage.getItem(`${THUMBNAIL_CACHE_PREFIX}${contentId}`)
    if (cached) {
      const { url, expiry } = JSON.parse(cached)
      if (Date.now() < expiry) {
        return url
      }
      // Expired, remove it
      localStorage.removeItem(`${THUMBNAIL_CACHE_PREFIX}${contentId}`)
    }
  } catch {
    // Ignore localStorage errors
  }
  return null
}

// Helper to cache thumbnail
function cacheThumbnail(contentId: string, url: string): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(
      `${THUMBNAIL_CACHE_PREFIX}${contentId}`,
      JSON.stringify({ url, expiry: Date.now() + THUMBNAIL_CACHE_EXPIRY })
    )
  } catch {
    // Ignore localStorage errors (quota exceeded, etc.)
  }
}

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString)
  const diffMs = Date.now() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return "Just now"
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`
  const diffWeek = Math.floor(diffDay / 7)
  if (diffWeek < 4) return `${diffWeek} week${diffWeek === 1 ? "" : "s"} ago`
  const diffMonth = Math.floor(diffDay / 30)
  if (diffMonth < 12) return `${diffMonth} month${diffMonth === 1 ? "" : "s"} ago`
  const diffYear = Math.floor(diffDay / 365)
  return `${diffYear} year${diffYear === 1 ? "" : "s"} ago`
}

function RecentCard({ content, workspaceName, selectionMode, isSelected, onToggleSelect }: RecentCardProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [thumbnailError, setThumbnailError] = useState(false)
  const [isLoadingThumbnail, setIsLoadingThumbnail] = useState(false)
  const thumbnailAttemptedRef = useRef(false) // Track if we've already attempted to load thumbnail
  
  // State for live title updates (for processing content)
  const [liveTitle, setLiveTitle] = useState<string | null>(null)
  const [liveMetadata, setLiveMetadata] = useState<any>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const pollCountRef = useRef(0)

  // Check for cached thumbnail on mount
  useEffect(() => {
    if (content.type === "pdf" && !thumbnailUrl) {
      const cached = getCachedThumbnail(content.id)
      if (cached) {
        setThumbnailUrl(cached)
        thumbnailAttemptedRef.current = true // Don't try to load again
      }
    }
  }, [content.id, content.type, thumbnailUrl])

  // Poll for title updates if content is still processing or has generic title
  useEffect(() => {
    const needsPolling = () => {
      const currentTitle = liveTitle || content.title
      const meta = liveMetadata || content.metadata
      
      // Check if we need to poll for updated title
      if (content.status === "processing") return true
      if (currentTitle === "Processing…") return true
      if (content.type === "youtube" && currentTitle === "YouTube Video") return true
      if (content.type === "youtube" && !meta?.title) return true
      
      return false
    }

    if (needsPolling() && pollCountRef.current < 10) {
      pollingRef.current = setTimeout(async () => {
        try {
          const response = await fetch(`/api/content/${content.id}/processed`)
          if (response.ok) {
            const data = await response.json()
            if (data.content) {
              const newTitle = data.content.title
              const newMetadata = data.content.metadata
              
              // Update if we got a better title
              if (newTitle && newTitle !== "Processing…" && newTitle !== "YouTube Video") {
                setLiveTitle(newTitle)
              }
              if (newMetadata) {
                setLiveMetadata(newMetadata)
              }
            }
          }
        } catch {
          // Ignore polling errors
        }
        pollCountRef.current++
      }, 2000 + pollCountRef.current * 1000) // Increasing delay: 2s, 3s, 4s, ...
    }

    return () => {
      if (pollingRef.current) {
        clearTimeout(pollingRef.current)
      }
    }
  }, [content.id, content.status, content.title, content.type, liveTitle, liveMetadata, content.metadata])

  // Memoize title calculation - use live data if available
  const title = useMemo(() => {
    const meta = liveMetadata || content.metadata
    const dbTitle = liveTitle || content.title
    
    // First check metadata for actual title
    if (meta && typeof meta === "object") {
      // For PDFs, prioritize display_title (extracted from PDF content)
      if (content.type === "pdf" && meta.display_title) {
        return meta.display_title
      }
      
      // For YouTube, prefer metadata.title as it's fetched from YouTube API
      if (meta.title && meta.title !== "YouTube Video") return meta.title
      
      // For other types, check display_title
      if (meta.display_title) return meta.display_title
      
      // Fallback to PDF metadata Title
      if (meta.info?.Title) {
        // Clean up file paths from title
        let cleanTitle = meta.info.Title
        if (cleanTitle.includes('\\') || cleanTitle.includes('/')) {
          cleanTitle = cleanTitle.split(/[\\\/]/).pop() || cleanTitle
        }
        cleanTitle = cleanTitle.replace(/\.(pmd|pdf)$/i, '')
        return cleanTitle
      }
    }
    // Then check database title (but exclude generic fallbacks)
    if (dbTitle && 
        dbTitle !== "Processing…" && 
        dbTitle !== "Untitled Content" &&
        dbTitle !== "YouTube Video") {
      return dbTitle
    }
    // Last resort: type-based fallback
    return `${content.type.charAt(0).toUpperCase() + content.type.slice(1)} Content`
  }, [content.title, content.metadata, content.type, liveTitle, liveMetadata])

  // Memoize timestamp
  const timestamp = useMemo(() => formatRelativeTime(content.created_at), [content.created_at])

  // Memoize videoId for YouTube thumbnails
  const videoId = useMemo(() => {
    if (content.type === "youtube") {
      return (
        (content.metadata && typeof content.metadata === "object"
          ? (content.metadata as any).videoId
          : null) ||
        (content.raw_url
          ? content.raw_url.match(/(?:v=|\/embed\/|\.be\/)([\w-]{6,})/)?.[1]
          : null)
      )
    }
    return null
  }, [content.type, content.metadata, content.raw_url])

  // Handle YouTube thumbnail - prefer metadata thumbnail, fallback to YouTube URL
  useEffect(() => {
    if (content.type === "youtube") {
      // First try metadata thumbnail (from YouTube API)
      const metaThumbnail = content.metadata && typeof content.metadata === "object" 
        ? (content.metadata as any).thumbnail 
        : null
      
      if (metaThumbnail) {
        setThumbnailUrl(metaThumbnail)
      } else if (videoId) {
        // Fallback to YouTube thumbnail URL
        setThumbnailUrl(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`)
      }
    }
  }, [content.type, content.metadata, videoId])

  // Ref for intersection observer (lazy loading)
  const cardRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  // Use Intersection Observer for lazy loading PDF thumbnails
  useEffect(() => {
    if (content.type !== "pdf" || thumbnailUrl || thumbnailAttemptedRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: "100px" } // Start loading 100px before visible
    )

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => observer.disconnect()
  }, [content.type, thumbnailUrl])

  // Handle PDF thumbnail (first page preview) - render client-side using PDF.js CDN
  useEffect(() => {
    // Only attempt to load thumbnail once per content and when visible
    if (content.type === "pdf" && content.id && !thumbnailUrl && !thumbnailError && !isLoadingThumbnail && !thumbnailAttemptedRef.current && isVisible) {
      thumbnailAttemptedRef.current = true
      setIsLoadingThumbnail(true)
          const loadPDFThumbnail = async () => {
        try {
          // Fetch PDF URL from API endpoint
          let pdfUrl: string | null = null
          
          try {
            const response = await fetch(`/api/content/${content.id}/pdf-thumbnail`)
            if (response.ok) {
              const data = await response.json()
              if (data.pdfUrl) {
                pdfUrl = data.pdfUrl
              }
            } else {
              // Try fallback to pdf-url endpoint
              console.warn(`[PDF-Thumbnail] Thumbnail endpoint failed, trying pdf-url fallback for content ${content.id}`)
              const fallbackResponse = await fetch(`/api/content/${content.id}/pdf-url`)
              if (fallbackResponse.ok) {
                const fallbackData = await fallbackResponse.json()
                if (fallbackData.pdfUrl) {
                  pdfUrl = fallbackData.pdfUrl
                }
              }
            }
          } catch (fetchError: any) {
            console.warn(`[PDF-Thumbnail] Error fetching PDF URL for content ${content.id}:`, fetchError?.message)
          }
          
          if (!pdfUrl) {
            console.warn(`[PDF-Thumbnail] No PDF URL available for content ${content.id}`)
            setThumbnailError(true)
            setIsLoadingThumbnail(false)
            return
          }
          
          // Render client-side using PDF.js CDN
          try {
            console.log(`[PDF-Thumbnail] Starting render for content ${content.id}`)
            
            // Use PDF.js 3.11.174 which has classic /build/ structure that works reliably
            const PDFJS_VERSION = "3.11.174"
            const PDFJS_CDN_SOURCES = [
              `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`,
              `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.min.js`,
              `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.min.js`,
            ]
            const PDFJS_WORKER_SOURCES = [
              `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`,
              `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.js`,
              `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.js`,
            ]

            type PDFJSPayload = { pdfjs: any; workerSrc: string }

            // Dynamically load PDF.js with multi-CDN fallback and memoized promise
            const loadPDFJS = (): Promise<PDFJSPayload> => {
              if (typeof window === "undefined") {
                return Promise.reject(new Error("Window not available for PDF.js"))
              }

              const existing = (window as any).pdfjsLib || (window as any).pdfjs
              if (existing) {
                const workerSrc =
                  (existing as any)?.GlobalWorkerOptions?.workerSrc ||
                  PDFJS_WORKER_SOURCES[0]
                return Promise.resolve({ pdfjs: existing, workerSrc })
              }

              if ((window as any).__pdfjsLibPromise) {
                return (window as any).__pdfjsLibPromise
              }

              const tryLoadScript = (src: string) =>
                new Promise<any>((resolve, reject) => {
                  // If script already present, resolve on load
                  const existingScript = Array.from(document.getElementsByTagName("script")).find(
                    (s) => s.src === src
                  )
                  if (existingScript && (existingScript as any).__pdfjsLoaded) {
                    const loadedLib = (window as any).pdfjsLib || (window as any).pdfjs
                    if (loadedLib) {
                      resolve(loadedLib)
                      return
                    }
                  }

                  const script = existingScript || document.createElement("script")
                  script.src = src
                  script.async = true
                  script.crossOrigin = "anonymous"

                  script.onload = () => {
                    ;(script as any).__pdfjsLoaded = true
                    const loaded = (window as any).pdfjsLib || (window as any).pdfjs
                    if (loaded) {
                      resolve(loaded)
                    } else {
                      reject(new Error("PDF.js not available after load"))
                    }
                  }

                  script.onerror = () => reject(new Error(`Failed to load PDF.js script from ${src}`))

                  if (!existingScript) {
                    document.head.appendChild(script)
                  }
                })

              ;(window as any).__pdfjsLibPromise = (async () => {
                let lastError: any = null
                for (let i = 0; i < PDFJS_CDN_SOURCES.length; i++) {
                  const src = PDFJS_CDN_SOURCES[i]
                  try {
                    const lib = await tryLoadScript(src)
                    // Use matching worker source from the same CDN
                    const workerSrc = PDFJS_WORKER_SOURCES[i] || PDFJS_WORKER_SOURCES[0]
                    console.log(`[PDF-Thumbnail] PDF.js loaded from ${src}`)
                    return { pdfjs: lib, workerSrc }
                  } catch (err) {
                    console.warn(`[PDF-Thumbnail] Failed to load PDF.js from ${src}:`, err)
                    lastError = err
                  }
                }
                throw lastError || new Error("Failed to load PDF.js from all sources")
              })()

              return (window as any).__pdfjsLibPromise
            }

            const { pdfjs, workerSrc } = await loadPDFJS()

            if (!pdfjs || !pdfjs.getDocument) {
              throw new Error("PDF.js library not available")
            }

            // Configure worker to match the loaded build
            if (pdfjs.GlobalWorkerOptions) {
              pdfjs.GlobalWorkerOptions.workerSrc = workerSrc
            }
            
            console.log(`[PDF-Thumbnail] Loading PDF document from URL for content ${content.id}`)
            
            // Load PDF with better error handling
            const loadingTask = pdfjs.getDocument({
              url: pdfUrl,
              withCredentials: false,
              httpHeaders: {},
            })
            
            const pdfDoc = await loadingTask.promise
            console.log(`[PDF-Thumbnail] PDF loaded, getting first page for content ${content.id}`)
            
            const page = await pdfDoc.getPage(1)
            
            // Calculate viewport - use scale that fits card height (180px) with good quality
            // Target height: ~180px, so scale accordingly
            const baseViewport = page.getViewport({ scale: 1.0 })
            const targetHeight = 360 // 2x for retina, then we'll scale down
            const scale = targetHeight / baseViewport.height
            
            const viewport = page.getViewport({ scale })
            
            // Create canvas with dimensions that fit the card
            const canvas = document.createElement("canvas")
            canvas.width = viewport.width
            canvas.height = viewport.height
            
            const context = canvas.getContext("2d")
            if (!context) throw new Error("Could not get canvas context")
            
            // Fill white background
            context.fillStyle = "#FFFFFF"
            context.fillRect(0, 0, canvas.width, canvas.height)
            
            console.log(`[PDF-Thumbnail] Rendering page to canvas for content ${content.id}`)
            
            // Render the full page
            await page.render({
              canvasContext: context,
              viewport: viewport,
            }).promise
            
            console.log(`[PDF-Thumbnail] Page rendered, cropping for content ${content.id}`)
            
            // Crop to show top-to-middle portion (top 60% of the page)
            const cropHeight = Math.floor(viewport.height * 0.6)
            const croppedCanvas = document.createElement("canvas")
            croppedCanvas.width = viewport.width
            croppedCanvas.height = cropHeight
            
            const croppedContext = croppedCanvas.getContext("2d")
            if (!croppedContext) throw new Error("Could not get cropped canvas context")
            
            // Fill white background for cropped canvas
            croppedContext.fillStyle = "#FFFFFF"
            croppedContext.fillRect(0, 0, croppedCanvas.width, croppedCanvas.height)
            
            // Draw the top portion of the rendered page
            croppedContext.drawImage(
              canvas,
              0, 0, viewport.width, cropHeight,  // Source: top portion
              0, 0, viewport.width, cropHeight   // Destination: full cropped canvas
            )
            
            // Convert to image with high quality
            const imageUrl = croppedCanvas.toDataURL("image/jpeg", 0.85)
            console.log(`[PDF-Thumbnail] Thumbnail generated successfully for content ${content.id}, length: ${imageUrl.length}`)
            
            // Cache the thumbnail for faster subsequent loads
            cacheThumbnail(content.id, imageUrl)
            
            setThumbnailUrl(imageUrl)
            setIsLoadingThumbnail(false)
          } catch (clientError: any) {
            console.error(`[PDF-Thumbnail] Client-side rendering error for content ${content.id}:`, {
              message: clientError?.message || String(clientError),
              error: clientError,
              stack: clientError?.stack
            })
            setThumbnailError(true)
            setIsLoadingThumbnail(false)
          }
        } catch (err: any) {
          console.error(`[PDF-Thumbnail] Error loading thumbnail for content ${content.id}:`, {
            message: err?.message || String(err),
            error: err,
            stack: err?.stack
          })
          setThumbnailError(true)
          setIsLoadingThumbnail(false)
        }
      }

      loadPDFThumbnail()
    }
  }, [content.type, content.id, thumbnailUrl, thumbnailError, isLoadingThumbnail, isVisible])

  // Render thumbnail based on content type
  const renderThumbnail = () => {
    // YouTube thumbnail
    if (content.type === "youtube") {
      if (thumbnailUrl && !thumbnailError) {
        return (
          <div className="relative w-full h-[160px] sm:h-[180px] bg-[#F9E5DD]/30 rounded-t-xl overflow-hidden">
            <img
              src={thumbnailUrl}
              alt={title}
              className="w-full h-full object-cover"
              onError={() => setThumbnailError(true)}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
              <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                <Play className="h-7 w-7 text-white ml-1" fill="white" />
              </div>
            </div>
          </div>
        )
      }
      // YouTube fallback when no thumbnail
      return (
        <div className="relative w-full h-[160px] sm:h-[180px] bg-gradient-to-br from-red-50 to-red-100 rounded-t-xl flex items-center justify-center">
          <Youtube className="h-14 w-14 text-red-500" />
        </div>
      )
    }

    // PDF thumbnail (first page preview)
    if (content.type === "pdf") {
      if (thumbnailUrl && !thumbnailError) {
        return (
          <div className="relative w-full h-[160px] sm:h-[180px] bg-[#F9E5DD]/30 rounded-t-xl overflow-hidden flex items-start justify-center">
            <img
              src={thumbnailUrl}
              alt={title}
              className="w-full h-full object-cover object-top"
              style={{ imageRendering: 'auto' }}
              onError={(e) => {
                console.error(`[PDF-Thumbnail] Image load error for content ${content.id}`)
                setThumbnailError(true)
              }}
              onLoad={() => {
                console.log(`[PDF-Thumbnail] Image loaded successfully for content ${content.id}`)
              }}
            />
          </div>
        )
      }
      // Show loading state or fallback icon
      if (isLoadingThumbnail) {
        return (
          <div className="w-full h-[160px] sm:h-[180px] bg-[#F9E5DD]/30 rounded-t-xl flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )
      }
      // Fallback: show PDF icon on error or while waiting
      return (
        <div className="w-full h-[160px] sm:h-[180px] bg-gradient-to-br from-red-50 to-red-100 rounded-t-xl flex items-center justify-center border border-red-200">
          <File className="h-14 w-14 text-red-400" />
        </div>
      )
    }

    // Text content
    if (content.type === "text") {
      return (
        <div className="w-full h-[160px] sm:h-[180px] bg-gradient-to-br from-blue-50 to-blue-100 rounded-t-xl flex items-center justify-center border border-blue-200">
          <FileText className="h-14 w-14 text-blue-400" />
        </div>
      )
    }

    // Audio content
    if (content.type === "audio") {
      return (
        <div className="w-full h-[160px] sm:h-[180px] bg-gradient-to-br from-purple-50 to-purple-100 rounded-t-xl flex items-center justify-center border border-purple-200">
          <Music className="h-14 w-14 text-purple-400" />
        </div>
      )
    }

    // Video content
    if (content.type === "video") {
      return (
        <div className="w-full h-[160px] sm:h-[180px] bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-t-xl flex items-center justify-center border border-indigo-200">
          <Play className="h-14 w-14 text-indigo-400" />
        </div>
      )
    }

    // Default
    return (
      <div className="w-full h-[160px] sm:h-[180px] bg-gradient-to-br from-[#F9E5DD] to-[#F9E5DD]/50 rounded-t-xl flex items-center justify-center border border-black/10">
        <FileText className="h-14 w-14 text-[#EFA07F]" />
      </div>
    )
  }

  // In selection mode, clicking toggles selection instead of navigating
  const handleClick = (e: React.MouseEvent) => {
    if (selectionMode && onToggleSelect) {
      e.preventDefault()
      e.stopPropagation()
      onToggleSelect()
    }
  }

  const CardWrapper = selectionMode ? 'div' : Link
  const cardProps = selectionMode 
    ? { onClick: handleClick, className: "block cursor-pointer" }
    : { href: `/workspace/${content.workspace_id}/content/${content.id}`, className: "block" }

  return (
    <CardWrapper {...cardProps as any}>
      <div
        ref={cardRef}
        className={cn(
          "bg-white border-2 rounded-xl overflow-hidden relative",
          "shadow-md hover:shadow-xl transition-all duration-200",
          "hover:scale-[1.02] cursor-pointer",
          "flex flex-col h-full",
          "group",
          isSelected 
            ? "border-blue-500 ring-4 ring-blue-200 shadow-xl" 
                : "border-black/10 hover:border-[#EFA07F]"
        )}
      >
        {/* Selection checkbox overlay */}
        {selectionMode && (
          <div 
            className={cn(
              "absolute top-2 left-2 z-10 w-6 h-6 rounded-full flex items-center justify-center transition-all",
              isSelected 
                ? "bg-blue-500 text-white border-2 border-blue-600" 
                : "bg-white border-2 border-black/10 hover:border-[#EFA07F]"
            )}
          >
            {isSelected && <Check className="h-4 w-4" />}
          </div>
        )}

        {/* Thumbnail Area */}
        {renderThumbnail()}

        {/* Card Body */}
        <div className="p-4 sm:p-5 flex flex-col gap-2 flex-1">
          {/* Title */}
          <h3 className="font-semibold text-black text-sm sm:text-base leading-tight line-clamp-2 group-hover:text-[#EFA07F] transition-colors">
            {title}
          </h3>

          {/* Space Name */}
          <p className="text-xs text-black/60 truncate">
            {workspaceName}
          </p>

          {/* Timestamp */}
          <p className="text-xs text-black/50 mt-auto">
            {timestamp}
          </p>
        </div>
      </div>
    </CardWrapper>
  )
}

// Memoize component to prevent unnecessary re-renders
export default memo(RecentCard)

