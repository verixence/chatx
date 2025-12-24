import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { getWorkspaceById, getContentsByWorkspaceId, getContentById, getUserById, createQuiz } from "@/lib/db/queries"
import { createQuizGenerationChain } from "@/lib/ai/chains"
import { getDefaultProvider } from "@/lib/ai/providers"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
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
        { error: "No content available for quiz generation" },
        { status: 400 }
      )
    }

    // Get user's AI provider preference
    const user = await getUserById(session.user.id)

    const provider = (user?.ai_provider as any) || getDefaultProvider()

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

