import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { getFlashcardById, updateFlashcard, createFlashcardReview } from "@/lib/db/queries"
import {
  calculateNextReview,
  getReviewQuality,
  type FlashcardReview,
} from "@/lib/flashcards/spaced-repetition"

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { result } = await req.json()

    if (!result || !["correct", "incorrect"].includes(result)) {
      return NextResponse.json(
        { error: "Result must be 'correct' or 'incorrect'" },
        { status: 400 }
      )
    }

    const flashcard = await getFlashcardById(params.id)

    if (!flashcard) {
      return NextResponse.json({ error: "Flashcard not found" }, { status: 404 })
    }

    // Calculate new review schedule
    const quality = getReviewQuality(result as "correct" | "incorrect")
    const reviewData: FlashcardReview = {
      difficulty: flashcard.difficulty,
      previousDifficulty: flashcard.difficulty,
      previousInterval: 0, // Will be calculated from nextReview
      previousEaseFactor: flashcard.difficulty,
    }

    // Calculate days since last review
    const now = new Date()
    const lastReview = new Date(flashcard.next_review)
    const daysSince = Math.max(
      0,
      Math.floor((now.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24))
    )
    reviewData.previousInterval = daysSince || 1

    const reviewResult = calculateNextReview(reviewData, quality)

    // Update flashcard
    const updated = await updateFlashcard(params.id, {
      difficulty: reviewResult.newDifficulty,
      next_review: reviewResult.nextReview.toISOString(),
    })

    if (!updated) {
      return NextResponse.json(
        { error: "Failed to update flashcard" },
        { status: 500 }
      )
    }

    // Create review record
    await createFlashcardReview({
      flashcard_id: flashcard.id,
      user_id: session.user.id,
      result: result as "correct" | "incorrect",
    })

    return NextResponse.json({
      flashcard: updated,
      nextReview: reviewResult.nextReview,
    })
  } catch (error: any) {
    console.error("Flashcard review error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to review flashcard" },
      { status: 500 }
    )
  }
}

