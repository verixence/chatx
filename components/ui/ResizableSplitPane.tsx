"use client"

import { useState, useRef, useEffect, useCallback, ReactNode } from "react"
import { GripVertical } from "lucide-react"
import { cn } from "@/lib/utils/cn"

interface ResizableSplitPaneProps {
  leftPane: ReactNode
  rightPane: ReactNode
  defaultLeftWidth?: number // Percentage (0-100)
  minLeftWidth?: number // Percentage
  maxLeftWidth?: number // Percentage
  className?: string
  onResize?: (leftWidth: number) => void
}

export default function ResizableSplitPane({
  leftPane,
  rightPane,
  defaultLeftWidth = 50,
  minLeftWidth = 20,
  maxLeftWidth = 80,
  className,
  onResize,
}: ResizableSplitPaneProps) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth)
  const [isResizing, setIsResizing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef<number>(0)
  const startWidthRef = useRef<number>(defaultLeftWidth)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    startXRef.current = e.clientX
    startWidthRef.current = leftWidth
    
    // Add global mouse event listeners
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !isResizing) return
      
      const containerWidth = containerRef.current.offsetWidth
      const deltaX = e.clientX - startXRef.current
      const deltaPercent = (deltaX / containerWidth) * 100
      const newWidth = Math.max(
        minLeftWidth,
        Math.min(maxLeftWidth, startWidthRef.current + deltaPercent)
      )
      
      setLeftWidth(newWidth)
      onResize?.(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [leftWidth, minLeftWidth, maxLeftWidth, onResize, isResizing])

  // Handle touch events for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    setIsResizing(true)
    startXRef.current = e.touches[0].clientX
    startWidthRef.current = leftWidth
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!containerRef.current || !isResizing) return
      
      const containerWidth = containerRef.current.offsetWidth
      const deltaX = e.touches[0].clientX - startXRef.current
      const deltaPercent = (deltaX / containerWidth) * 100
      const newWidth = Math.max(
        minLeftWidth,
        Math.min(maxLeftWidth, startWidthRef.current + deltaPercent)
      )
      
      setLeftWidth(newWidth)
      onResize?.(newWidth)
    }

    const handleTouchEnd = () => {
      setIsResizing(false)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }

    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)
  }, [leftWidth, minLeftWidth, maxLeftWidth, onResize, isResizing])

  // Reset width on window resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        // Maintain the same percentage on window resize
        onResize?.(leftWidth)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [leftWidth, onResize])

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex h-full w-full",
        isResizing && "select-none cursor-col-resize",
        className
      )}
      style={{ userSelect: isResizing ? 'none' : 'auto' }}
    >
      {/* Left Pane */}
      <div
        className="flex-shrink-0 h-full overflow-hidden"
        style={{ width: `${leftWidth}%` }}
      >
        {leftPane}
      </div>

      {/* Resize Handle */}
      <div
        className={cn(
          "flex items-center justify-center w-1 bg-gray-200 hover:bg-[#EFA07F]/60 cursor-col-resize transition-all duration-200 relative z-10 group",
          isResizing && "bg-[#EFA07F] w-1.5"
        )}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{ minWidth: isResizing ? '6px' : '4px', maxWidth: isResizing ? '6px' : '4px' }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <GripVertical className={cn(
            "h-4 w-4 transition-opacity",
            isResizing ? "text-[#EFA07F] opacity-100" : "text-gray-400 opacity-0 group-hover:opacity-50"
          )} />
        </div>
      </div>

      {/* Right Pane */}
      <div
        className="flex-1 h-full overflow-hidden min-w-0"
        style={{ width: `${100 - leftWidth}%` }}
      >
        {rightPane}
      </div>
    </div>
  )
}

