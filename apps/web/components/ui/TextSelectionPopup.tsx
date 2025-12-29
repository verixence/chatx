"use client"

import { useEffect, useRef, useState } from "react"
import { MessageSquare, Lightbulb, FileQuestion, Layers } from "lucide-react"
import { cn } from "@/lib/utils/cn"

interface TextSelectionPopupProps {
  selectedText: string
  position: { x: number; y: number }
  onChat?: () => void
  onExplain?: () => void
  onQuiz?: () => void
  onFlashcards?: () => void
}

export default function TextSelectionPopup({
  selectedText,
  position,
  onChat,
  onExplain,
  onQuiz,
  onFlashcards,
}: TextSelectionPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null)
  const [adjustedPosition, setAdjustedPosition] = useState(position)

  useEffect(() => {
    if (popupRef.current) {
      const rect = popupRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let x = position.x
      let y = position.y - rect.height - 10 // Position above selection

      // Adjust if popup goes off screen
      if (x + rect.width > viewportWidth) {
        x = viewportWidth - rect.width - 10
      }
      if (x < 10) {
        x = 10
      }
      if (y < 10) {
        y = position.y + 30 // Position below selection if no room above
      }
      if (y + rect.height > viewportHeight) {
        y = viewportHeight - rect.height - 10
      }

      setAdjustedPosition({ x, y })
    }
  }, [position])

  const actions = [
    { icon: Lightbulb, label: "Explain", onClick: onExplain, color: "text-yellow-600 hover:bg-yellow-50" },
    { icon: MessageSquare, label: "Chat", onClick: onChat, color: "text-blue-600 hover:bg-blue-50" },
    { icon: FileQuestion, label: "Quiz", onClick: onQuiz, color: "text-purple-600 hover:bg-purple-50" },
    { icon: Layers, label: "Flashcards", onClick: onFlashcards, color: "text-green-600 hover:bg-green-50" },
  ]

  // Truncate text if too long
  const displayText = selectedText.length > 100 
    ? selectedText.substring(0, 100) + "..." 
    : selectedText

  return (
    <div
      ref={popupRef}
      className="text-selection-popup fixed z-50 bg-white rounded-lg shadow-xl border border-gray-300 overflow-hidden"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
        transform: 'translateX(-50%)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Selected Text Preview */}
      <div className="px-4 py-2.5 bg-blue-50 border-b border-gray-200">
        <p className="text-sm text-gray-700 line-clamp-2 font-medium">
          "{displayText}"
        </p>
      </div>
      
      {/* Action Buttons */}
      <div className="flex items-center gap-0 p-1.5">
        {actions.map((action, index) => {
          const Icon = action.icon
          return (
            <button
              key={index}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                action.onClick?.()
              }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-md transition-all",
                "text-sm font-medium flex-1 justify-center",
                "hover:scale-105 active:scale-95",
                action.color
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{action.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

