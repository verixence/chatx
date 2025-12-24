"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils/cn"

interface PDFViewerProps {
  url: string
  className?: string
}

// PDF.js will be loaded dynamically
let pdfjsLib: any = null
let pdfjsLoading: Promise<any> | null = null

export default function PDFViewer({ url, className = "" }: PDFViewerProps) {
  const [pdf, setPdf] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scale, setScale] = useState(1.5)
  const [fitToPage, setFitToPage] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [pdfjsReady, setPdfjsReady] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize PDF.js with proper error handling
  useEffect(() => {
    const initPDFJS = async () => {
      if (pdfjsLib) {
        setPdfjsReady(true)
        return
      }

      if (pdfjsLoading) {
        await pdfjsLoading
        if (pdfjsLib) {
          setPdfjsReady(true)
        }
        return
      }

      if (typeof window === "undefined") return

      try {
        pdfjsLoading = (async () => {
          // Use CDN script tag approach to avoid webpack bundling issues
          if (typeof window === "undefined") return null
          
          // Check if already loaded
          if ((window as any).pdfjsLib) {
            pdfjsLib = (window as any).pdfjsLib
            if (pdfjsLib && pdfjsLib.GlobalWorkerOptions) {
              pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js"
            }
            return pdfjsLib
          }
          
          // Load from CDN using script tag
          return new Promise((resolve, reject) => {
            // Check if script already exists
            const existingScript = document.querySelector('script[src*="pdf.js"]')
            if (existingScript) {
              // Wait a bit for it to load
              setTimeout(() => {
                pdfjsLib = (window as any).pdfjsLib || (window as any).pdfjs
                if (pdfjsLib) {
                  if (pdfjsLib.GlobalWorkerOptions) {
                    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js"
                  }
                  resolve(pdfjsLib)
                } else {
                  reject(new Error("PDF.js not available after script load"))
                }
              }, 500)
              return
            }
            
            const script = document.createElement("script")
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.js"
            script.async = true
            script.crossOrigin = "anonymous"
            
            script.onload = () => {
              // Wait a bit for PDF.js to initialize
              setTimeout(() => {
                // PDF.js from CDN exposes itself as window.pdfjsLib or window.pdfjs
                pdfjsLib = (window as any).pdfjsLib || (window as any).pdfjs
                
                // Also try accessing via the module exports
                if (!pdfjsLib && (window as any).pdfjs) {
                  pdfjsLib = (window as any).pdfjs
                }
                
                if (!pdfjsLib) {
                  // Try one more time with a different global name
                  pdfjsLib = (window as any).pdfjsLib || (window as any).pdfjs
                }
                
                if (!pdfjsLib) {
                  reject(new Error("PDF.js library not found after script load"))
                  return
                }
                
                // Configure worker
                if (pdfjsLib.GlobalWorkerOptions) {
                  pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js"
                }
                
                resolve(pdfjsLib)
              }, 100)
            }
            
            script.onerror = () => {
              reject(new Error("Failed to load PDF.js script from CDN"))
            }
            
            document.head.appendChild(script)
          })
        })()
        
        await pdfjsLoading
        setPdfjsReady(true)
        pdfjsLoading = null
      } catch (err: any) {
        console.error("Failed to load PDF.js:", err)
        // Set error but allow iframe fallback
        setError("Failed to load PDF.js, using iframe fallback")
        setLoading(false)
        pdfjsLoading = null
      }
    }
    
    initPDFJS()
  }, [])

  // Load PDF document
  useEffect(() => {
    if (!pdfjsReady || !url) return
    
    // Ensure pdfjsLib is available (might be loaded from CDN)
    if (!pdfjsLib && typeof window !== "undefined") {
      pdfjsLib = (window as any).pdfjsLib || (window as any).pdfjs
    }
    
    if (!pdfjsLib) return

    let isMounted = true
    let loadingTask: any = null

    const loadPDF = async () => {
      try {
        setLoading(true)
        setError(null)

        // Cancel previous loading task if exists
        if (loadingTask) {
          loadingTask.destroy()
        }

        loadingTask = pdfjsLib.getDocument({
          url: url,
          withCredentials: false,
          httpHeaders: {},
          cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
        })

        const pdfDoc = await loadingTask.promise

        if (!isMounted) {
          pdfDoc.destroy()
          return
        }

        setPdf(pdfDoc)
        setTotalPages(pdfDoc.numPages)
        setCurrentPage(1)
        setLoading(false)
        setRetryCount(0)
      } catch (err: any) {
        console.error("Error loading PDF:", err)
        if (isMounted) {
          // Auto-retry up to 3 times
          if (retryCount < 3) {
            setTimeout(() => {
              setRetryCount((prev) => prev + 1)
            }, 1000 * (retryCount + 1))
          } else {
            setError("Unable to load document")
            setLoading(false)
          }
        }
      }
    }

    loadPDF()

    return () => {
      isMounted = false
      if (loadingTask) {
        loadingTask.destroy()
      }
    }
  }, [url, retryCount, pdfjsLib])

  // Calculate scale for fit-to-page
  const calculateFitScale = (page: any, containerWidth: number) => {
    const viewport = page.getViewport({ scale: 1 })
    const scaleX = (containerWidth - 64) / viewport.width
    return Math.min(scaleX, 2.0) // Max 200% zoom
  }

  // Render page
  useEffect(() => {
    if (!pdf || !canvasRef.current || !containerRef.current) return

    const renderPage = async () => {
      try {
        const page = await pdf.getPage(currentPage)
        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container) return

        const context = canvas.getContext("2d")
        if (!context) return

        // Calculate scale
        let renderScale = scale
        if (fitToPage) {
          const containerWidth = container.clientWidth
          renderScale = calculateFitScale(page, containerWidth)
        }

        // Get viewport
        const viewport = page.getViewport({ scale: renderScale })

        // Set canvas dimensions
        canvas.height = viewport.height
        canvas.width = viewport.width

        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height)

        // Render PDF page
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        }

        await page.render(renderContext).promise
      } catch (err) {
        console.error("Error rendering page:", err)
      }
    }

    // Debounce rendering
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current)
    }

    renderTimeoutRef.current = setTimeout(() => {
      renderPage()
    }, 100)

    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current)
      }
    }
  }, [pdf, currentPage, scale, fitToPage])

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
      containerRef.current?.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
      containerRef.current?.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      containerRef.current?.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleZoomIn = () => {
    setFitToPage(false)
    setScale((prev) => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setFitToPage(false)
    setScale((prev) => Math.max(prev - 0.25, 0.5))
  }

  const handleFitToPage = () => {
    setFitToPage(true)
  }

  // Fallback to iframe if PDF.js fails to load after timeout
  if (error && url && (error.includes("Failed to load PDF.js") || error.includes("library not found"))) {
    return (
      <div className={cn("flex flex-col h-full bg-[#f9fafb]", className)}>
        <div className="flex-1 overflow-hidden">
          <iframe
            src={url}
            className="w-full h-full border-0"
            title="PDF Document"
            style={{ minHeight: "500px" }}
          />
        </div>
      </div>
    )
  }

  // Loading skeleton
  if (loading || !pdfjsReady || (!pdfjsLib && typeof window !== "undefined" && !(window as any).pdfjsLib && !(window as any).pdfjs)) {
    return (
      <div className={cn("flex flex-col h-full bg-[#f9fafb]", className)}>
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-600 font-medium">Loading document...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state (never show raw error)
  if (error) {
    return (
      <div className={cn("flex flex-col h-full bg-[#f9fafb]", className)}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <RotateCw className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-600 font-medium mb-2">Unable to load document</p>
            <Button
              onClick={() => {
                setError(null)
                setRetryCount(0)
                setLoading(true)
              }}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!pdf) {
    return null
  }

  return (
    <div className={cn("flex flex-col h-full bg-[#f9fafb]", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-2 sm:px-4 md:px-6 py-2 sm:py-3 border-b border-gray-200 bg-white flex-wrap gap-2">
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPreviousPage}
            disabled={currentPage <= 1}
            className="h-7 w-7 sm:h-8 sm:w-8 p-0"
          >
            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <div className="flex items-center gap-1 sm:gap-2">
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value)
                if (!isNaN(page)) {
                  goToPage(page)
                }
              }}
              className="w-10 sm:w-12 h-7 sm:h-8 text-center text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">/ {totalPages}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextPage}
            disabled={currentPage >= totalPages}
            className="h-7 w-7 sm:h-8 sm:w-8 p-0"
          >
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            className="h-7 w-7 sm:h-8 sm:w-8 p-0"
          >
            <ZoomOut className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <span className="text-xs text-gray-600 w-8 sm:w-12 text-center">
            {Math.round((fitToPage ? scale : scale) * 100)}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            className="h-7 w-7 sm:h-8 sm:w-8 p-0"
          >
            <ZoomIn className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFitToPage}
            className={cn(
              "h-7 sm:h-8 px-2 sm:px-3 text-xs",
              fitToPage && "bg-gray-100"
            )}
          >
            <Maximize2 className="h-3 w-3 mr-0.5 sm:mr-1" />
            <span className="hidden sm:inline">Fit</span>
          </Button>
        </div>
      </div>

      {/* PDF Canvas Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{ scrollBehavior: "smooth" }}
      >
        <div className="flex justify-center py-4 sm:py-6 md:py-8 px-2 sm:px-4">
          <div className="bg-white rounded-lg shadow-lg p-2 sm:p-4">
            <canvas
              ref={canvasRef}
              className="block max-w-full"
              style={{ display: "block" }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

