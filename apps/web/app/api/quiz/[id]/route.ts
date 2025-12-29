import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth/middleware"
import { getQuizById, getWorkspaceById, getQuizAttemptsByQuizId, createQuizAttempt, upsertUserProgress } from "@/lib/db/queries"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(req)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const quiz = await getQuizById(params.id)

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    // Get workspace to check access
    const workspace = await getWorkspaceById(quiz.workspace_id)

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    // Check access
    if (workspace.user_id !== auth.userId && !workspace.shared) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get attempts
    const attempts = await getQuizAttemptsByQuizId(params.id, auth.userId)

    return NextResponse.json({
      quiz: {
        ...quiz,
        workspace,
        attempts,
      },
    })
  } catch (error: any) {
    console.error("Quiz fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch quiz" },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(req)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { answers } = await req.json()

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: "Answers array is required" },
        { status: 400 }
      )
    }

    const quiz = await getQuizById(params.id)

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    // Get workspace to check access
    const workspace = await getWorkspaceById(quiz.workspace_id)

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    // Check access
    if (workspace.user_id !== auth.userId && !workspace.shared) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Calculate score
    const questions = quiz.questions as any[]
    let correct = 0
    const results = questions.map((question, idx) => {
      const userAnswer = answers[idx]
      const isCorrect = userAnswer?.toLowerCase().trim() === question.correctAnswer?.toLowerCase().trim()
      if (isCorrect) correct++
      return {
        question: question.question,
        userAnswer: userAnswer || "",
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        isCorrect,
      }
    })

    const score = (correct / questions.length) * 100

    // Save attempt
    const attempt = await createQuizAttempt({
      quiz_id: quiz.id,
      user_id: auth.userId,
      answers,
      score,
    })

    if (!attempt) {
      return NextResponse.json(
        { error: "Failed to save quiz attempt" },
        { status: 500 }
      )
    }

    // Update user progress
    await upsertUserProgress({
      user_id: auth.userId,
      workspace_id: quiz.workspace_id,
    })

    return NextResponse.json({
      attempt,
      results,
      score: Math.round(score),
    })
  } catch (error: any) {
    console.error("Quiz submission error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to submit quiz" },
      { status: 500 }
    )
  }
}

