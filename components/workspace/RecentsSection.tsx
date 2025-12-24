"use client"

import { useMemo, useState, memo } from "react"
import { Trash2, X, CheckSquare, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
// Import directly instead of dynamic for faster initial load
import RecentCard from "./RecentCard"

// Loading skeleton component
const CardSkeleton = memo(function CardSkeleton() {
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-black/10 rounded-xl overflow-hidden animate-pulse shadow-md">
      <div className="w-full h-[140px] bg-[#F9E5DD]/30" />
      <div className="p-3 sm:p-4 space-y-2">
        <div className="h-4 bg-[#F9E5DD]/50 rounded w-3/4" />
        <div className="h-3 bg-[#F9E5DD]/50 rounded w-1/2" />
        <div className="h-3 bg-[#F9E5DD]/50 rounded w-1/3" />
      </div>
    </div>
  )
})

interface RecentsSectionProps {
  contents: Array<{
    id: string
    type: "pdf" | "youtube" | "text" | "audio" | "video"
    raw_url?: string | null
    metadata?: any
    created_at: string
    workspace_id: string
    title: string // Content title from database
    status?: "processing" | "ready" | "partial"
  }>
  workspaceName: string
}

export default function RecentsSection({ contents, workspaceName }: RecentsSectionProps) {
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)

  // Memoize sorted contents to avoid re-sorting on every render
  const sortedContents = useMemo(() => {
    return [...contents].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return dateB - dateA
    })
  }, [contents])

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const selectAll = () => {
    if (selectedIds.size === sortedContents.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(sortedContents.map(c => c.id)))
    }
  }

  const cancelSelection = () => {
    setSelectionMode(false)
    setSelectedIds(new Set())
  }

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return
    
    const confirmDelete = confirm(`Are you sure you want to delete ${selectedIds.size} item(s)? This cannot be undone.`)
    if (!confirmDelete) return

    setIsDeleting(true)
    try {
      // Delete each selected content
      const deletePromises = Array.from(selectedIds).map(async (contentId) => {
        const content = sortedContents.find(c => c.id === contentId)
        if (!content) return
        
        const response = await fetch(`/api/workspace/${content.workspace_id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentId }),
        })
        
        if (!response.ok) {
          console.error(`Failed to delete content ${contentId}`)
        }
      })
      
      await Promise.all(deletePromises)
      
      // Refresh the page to show updated content
      window.location.reload()
    } catch (error) {
      console.error("Error deleting content:", error)
      alert("Failed to delete some items. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  if (sortedContents.length === 0) {
    return null
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold text-black">Recents</h2>
        <div className="flex items-center gap-2">
          {selectionMode ? (
            <>
              <button
                onClick={selectAll}
                className="flex items-center gap-1 text-xs sm:text-sm text-black/70 hover:text-black"
              >
                {selectedIds.size === sortedContents.length ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">
                  {selectedIds.size === sortedContents.length ? "Deselect All" : "Select All"}
                </span>
              </button>
              <Button
                variant="destructive"
                size="sm"
                onClick={deleteSelected}
                disabled={selectedIds.size === 0 || isDeleting}
                className="text-xs sm:text-sm"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {isDeleting ? "Deleting..." : `Delete (${selectedIds.size})`}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={cancelSelection}
                className="text-xs sm:text-sm"
              >
                <X className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Cancel</span>
              </Button>
            </>
          ) : (
            <>
              <button
                onClick={() => setSelectionMode(true)}
                className="text-xs sm:text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                <CheckSquare className="h-4 w-4" />
                <span>Select</span>
              </button>
              {sortedContents.length > 4 && (
                <button className="text-xs sm:text-sm text-black/70 hover:text-black">
                  View all
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Grid: 4 columns desktop, 2 tablet, 1 mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        {sortedContents.map((content) => (
          <RecentCard
            key={content.id}
            content={content}
            workspaceName={workspaceName}
            selectionMode={selectionMode}
            isSelected={selectedIds.has(content.id)}
            onToggleSelect={() => toggleSelection(content.id)}
          />
        ))}
      </div>
    </div>
  )
}

