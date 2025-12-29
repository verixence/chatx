import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth/middleware"
import { getWorkspaceById, getContentsByWorkspaceId, getContentById, getUserById, createQuiz } from "@/lib/db/queries"
import { createQuizGenerationChain } from "@/lib/ai/chains"
import { getDefaultProvider } from "@/lib/ai/providers"
import { hasFeatureAccess, isTrialExpired } from "@/lib/subscriptions/subscription"

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { workspaceId, contentId, difficulty, numQuestions } = await req.json()

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
    if (workspace.user_id !== auth.userId && !workspace.shared) {
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
        { error: "No content available for quiz generation" },
        { status: 400 }
      )
    }

    // Get user's AI provider preference
    const user = await getUserById(auth.userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if trial has expired
    if (user.subscription_status === 'trial' && isTrialExpired(user.subscription_status, user.subscription_end_date)) {
      return NextResponse.json(
        { 
          error: 'Your 14-day free trial has ended. Please upgrade to Pro to continue using quizzes.',
          code: 'TRIAL_EXPIRED'
        },
        { status: 403 }
      )
    }

    // Check subscription feature access
    const subscriptionTier = (user.subscription as 'freemium' | 'pro' | 'enterprise') || 'freemium'
    
    if (!hasFeatureAccess(subscriptionTier, 'quizzes')) {
      return NextResponse.json(
        { 
          error: 'Quiz generation is not available for your subscription tier. Upgrade to Pro for unlimited quizzes.',
          code: 'FEATURE_NOT_AVAILABLE'
        },
        { status: 403 }
      )
    }

    // Always use Groq by default (no user preferences)
    const provider = getDefaultProvider()

    // Generate quiz
    const questions = await createQuizGenerationChain(
      contentText,
      difficulty || "medium",
      numQuestions || 5,
      provider
    )

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "Failed to generate quiz questions" },
        { status: 500 }
      )
    }

    // Create quiz record
    const quiz = await createQuiz({
      workspace_id: workspaceId,
      content_id: contentId || undefined,
      questions,
      difficulty: (difficulty || "medium") as any,
    })

    if (!quiz) {
      return NextResponse.json(
        { error: "Failed to create quiz" },
        { status: 500 }
      )
    }

    return NextResponse.json({ quiz })
  } catch (error: any) {
    console.error("Quiz generation error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate quiz" },
      { status: 500 }
    )
  }
}

