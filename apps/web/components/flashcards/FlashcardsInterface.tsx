"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileText, CheckCircle, XCircle, RotateCcw, Loader2 } from "lucide-react"
import { getCardsDueForReview } from "@/lib/flashcards/spaced-repetition"
import type { Flashcard } from "@/lib/db/supabase"

interface FlashcardsInterfaceProps {
  workspaceId: string
  existingFlashcards: Flashcard[]
  contentId?: string
}

export default function FlashcardsInterface({
  workspaceId,
  existingFlashcards,
  contentId,
}: FlashcardsInterfaceProps) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>(existingFlashcards)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [numCards, setNumCards] = useState(10)
  const [reviewing, setReviewing] = useState(false)

  // Update flashcards when existingFlashcards prop changes (e.g., after page refresh)
  useEffect(() => {
    setFlashcards(existingFlashcards)
  }, [existingFlashcards])

  useEffect(() => {
    const dueCards = getCardsDueForReview(
      flashcards.map(card => ({
        id: card.id,
        nextReview: new Date(card.next_review),
        difficulty: card.difficulty,
      }))
    )
    if (dueCards.length > 0 && !reviewing) {
      setReviewing(true)
      setCurrentIndex(0)
      setShowAnswer(false)
    }
  }, [flashcards, reviewing])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const response = await fetch("/api/flashcards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          contentId,
          numCards,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate flashcards")
      }

      setFlashcards([...flashcards, ...data.flashcards])
    } catch (error: any) {
      alert(error.message || "Failed to generate flashcards")
    } finally {
      setGenerating(false)
    }
  }

  const handleReview = async (result: "correct" | "incorrect") => {
    const currentCard = flashcards[currentIndex]
    if (!currentCard) return

    try {
      const response = await fetch(`/api/flashcards/${currentCard.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to review flashcard")
      }

      // Update flashcard in state
      setFlashcards(
        flashcards.map((card) =>
          card.id === currentCard.id
            ? {
                ...card,
                difficulty: data.flashcard.difficulty,
                next_review: data.nextReview,
              }
            : card
        )
      )

      // Move to next card
      if (currentIndex < flashcards.length - 1) {
        setCurrentIndex(currentIndex + 1)
        setShowAnswer(false)
      } else {
        // Finished reviewing
        setReviewing(false)
        setCurrentIndex(0)
        setShowAnswer(false)
      }
    } catch (error: any) {
      alert(error.message || "Failed to review flashcard")
    }
  }

  const dueCards = getCardsDueForReview(
    flashcards.map(card => ({
      id: card.id,
      nextReview: new Date(card.next_review),
      difficulty: card.difficulty,
    }))
  )
  const currentCardId = reviewing && dueCards.length > 0
    ? dueCards[currentIndex % dueCards.length].id
    : null
  const currentCard = currentCardId ? flashcards.find(c => c.id === currentCardId) : null

  if (reviewing && currentCard) {
    return (
      <Card className="min-h-[400px] flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Review Mode</CardTitle>
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {dueCards.length}
            </span>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-center space-y-6">
          <div className="text-center space-y-4 w-full">
            <div className="text-2xl font-semibold mb-8">{currentCard.question}</div>
            {showAnswer ? (
              <div className="space-y-6">
                <div className="text-lg text-muted-foreground">{currentCard.answer}</div>
                <div className="flex justify-center space-x-4">
                  <Button
                    variant="destructive"
                    onClick={() => handleReview("incorrect")}
                    className="flex items-center space-x-2"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Incorrect</span>
                  </Button>
                  <Button
                    onClick={() => handleReview("correct")}
                    className="flex items-center space-x-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Correct</span>
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={() => setShowAnswer(true)} size="lg">
                Show Answer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Generate Flashcards</span>
          </CardTitle>
          <CardDescription>
            Create flashcards from your workspace content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Number of Cards</Label>
            <Input
              type="number"
              min={5}
              max={50}
              value={numCards}
              onChange={(e) => setNumCards(parseInt(e.target.value) || 10)}
            />
          </div>
          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Generate Flashcards
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {flashcards.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Your Flashcards</CardTitle>
              <CardDescription>
                {dueCards.length} cards due for review
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dueCards.length > 0 ? (
                <Button
                  onClick={() => {
                    setReviewing(true)
                    setCurrentIndex(0)
                    setShowAnswer(false)
                  }}
                  className="w-full"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Start Review ({dueCards.length} cards)
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No cards due for review. All caught up!
                </p>
              )}
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium">Total: {flashcards.length} cards</p>
                <p className="text-sm text-muted-foreground">
                  Next review:{" "}
                  {flashcards.length > 0
                    ? new Date(
                        Math.min(
                          ...flashcards.map((c) => new Date(c.next_review).getTime())
                        )
                      ).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Flashcards ({flashcards.length})</CardTitle>
              <CardDescription>
                View all your flashcards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {flashcards.map((card, index) => (
                  <Card key={card.id} className="border">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">Card {index + 1}</CardTitle>
                        <span className="text-xs text-muted-foreground">
                          {new Date(card.next_review).toLocaleDateString()}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Question:</p>
                        <p className="text-sm">{card.question}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Answer:</p>
                        <p className="text-sm">{card.answer}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

