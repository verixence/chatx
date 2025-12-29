// SM-2 Algorithm for spaced repetition
// Based on SuperMemo 2 algorithm

export interface FlashcardReview {
  difficulty: number // 0-5, where 0 is easiest
  previousDifficulty: number
  previousInterval: number // days
  previousEaseFactor: number
}

export interface ReviewResult {
  newDifficulty: number
  newInterval: number
  newEaseFactor: number
  nextReview: Date
}

export function calculateNextReview(
  review: FlashcardReview,
  quality: number // 0-5, where 5 is perfect recall
): ReviewResult {
  let { difficulty, previousDifficulty, previousInterval, previousEaseFactor } = review

  // Initialize if first review
  if (previousInterval === 0) {
    previousInterval = 1
  }
  if (previousEaseFactor === 0) {
    previousEaseFactor = 2.5
  }

  // Calculate new ease factor
  let newEaseFactor =
    previousEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))

  // Minimum ease factor is 1.3
  if (newEaseFactor < 1.3) {
    newEaseFactor = 1.3
  }

  // Calculate new interval based on quality
  let newInterval: number

  if (quality < 3) {
    // Incorrect answer - reset interval
    newInterval = 1
    difficulty = 0
  } else {
    // Correct answer
    if (previousInterval === 1) {
      newInterval = 1
    } else if (previousInterval === 2) {
      newInterval = 6
    } else {
      newInterval = Math.round(previousInterval * newEaseFactor)
    }
    difficulty = quality
  }

  // Calculate next review date
  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + newInterval)

  return {
    newDifficulty: difficulty,
    newInterval,
    newEaseFactor,
    nextReview,
  }
}

export function getCardsDueForReview(
  flashcards: Array<{
    id: string
    nextReview: Date
    difficulty: number
  }>
): Array<{ id: string; nextReview: Date; difficulty: number }> {
  const now = new Date()
  return flashcards.filter((card) => new Date(card.nextReview) <= now)
}

export function getReviewQuality(userResponse: "correct" | "incorrect"): number {
  // Map user response to quality score (0-5)
  return userResponse === "correct" ? 5 : 0
}

