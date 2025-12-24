import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { getWorkspaceById, getContentsByWorkspaceId, getContentById, getUserById, createFlashcard } from "@/lib/db/queries"
import { createFlashcardGenerationChain } from "@/lib/ai/chains"
import { getDefaultProvider } from "@/lib/ai/providers"
import { hasFeatureAccess, isTrialExpired } from "@/lib/subscriptions/subscription"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { workspaceId, contentId, numCards } = await req.json()

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace ID is required" },
        { status: 400 }
      )
    }

    // Get workspace
    const workspace = await getWorkspaceById(workspaceId)

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    // Check access
    if (workspace.user_id !== session.user.id && !workspace.shared) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get contents
    let contents
    if (contentId) {
      const content = await getContentById(contentId)
      contents = content ? [content] : []
    } else {
      const allContents = await getContentsByWorkspaceId(workspaceId)
      contents = allContents.filter(c => c.status === "complete")
    }

    // Combine all content text
    let contentText = ""
    for (const content of contents) {
      if (content.extracted_text) {
        contentText += content.extracted_text + "\n\n"
      }
    }

    if (!contentText.trim()) {
      return NextResponse.json(
        { error: "No content available for flashcard generation" },
        { status: 400 }
      )
    }

    // Get user's AI provider preference
    const user = await getUserById(session.user.id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if trial has expired
    if (user.subscription_status === 'trial' && isTrialExpired(user.subscription_status, user.subscription_end_date)) {
      return NextResponse.json(
        { 
          error: 'Your 14-day free trial has ended. Please upgrade to Pro to continue using flashcards.',
          code: 'TRIAL_EXPIRED'
        },
        { status: 403 }
      )
    }

    // Check subscription feature access
    const subscriptionTier = (user.subscription as 'freemium' | 'pro' | 'enterprise') || 'freemium'
    
    if (!hasFeatureAccess(subscriptionTier, 'flashcards')) {
      return NextResponse.json(
        { 
          error: 'Flashcard generation is not available for your subscription tier. Upgrade to Pro for unlimited flashcards.',
          code: 'FEATURE_NOT_AVAILABLE'
        },
        { status: 403 }
      )
    }

    const provider = (user.ai_provider as any) || getDefaultProvider()

    // Generate flashcards
    const flashcardPairs = await createFlashcardGenerationChain(
      contentText,
      numCards || 10,
      provider
    )

    if (!Array.isArray(flashcardPairs) || flashcardPairs.length === 0) {
      return NextResponse.json(
        { error: "Failed to generate flashcards" },
        { status: 500 }
      )
    }

    // Create flashcard records
    const flashcards = await Promise.all(
      flashcardPairs.map((pair) =>
        createFlashcard({
          workspace_id: workspaceId,
          content_id: contentId || undefined,
          question: pair.question,
          answer: pair.answer,
          difficulty: 2.5,
        })
      )
    )

    return NextResponse.json({ flashcards: flashcards.filter(f => f !== null) })
  } catch (error: any) {
    console.error("Flashcard generation error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate flashcards" },
      { status: 500 }
    )
  }
}

