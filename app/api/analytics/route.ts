export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { getWorkspacesByUserId, getUserProgress } from "@/lib/db/queries"
import { supabaseAdmin } from "@/lib/db/supabase"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const workspaceId = searchParams.get("workspaceId")

    // Get user's workspaces
    const workspaces = await getWorkspacesByUserId(session.user.id)

    // Get counts for each workspace
    const workspacesWithStats = await Promise.all(
      workspaces.map(async (workspace) => {
        const { count: contentsCount } = await supabaseAdmin
          .from('contents')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspace.id)
          .maybeSingle()

        const { count: quizzesCount } = await supabaseAdmin
          .from('quizzes')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspace.id)
          .maybeSingle()

        const { count: flashcardsCount } = await supabaseAdmin
          .from('flashcards')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspace.id)
          .maybeSingle()

        const progress = await getUserProgress(session.user.id, workspace.id)

        return {
          ...workspace,
          _count: {
            contents: contentsCount || 0,
            quizzes: quizzesCount || 0,
            flashcards: flashcardsCount || 0,
          },
          progress: progress ? [progress] : [],
        }
      })
    )

    // Calculate overall stats
    const totalContents = workspacesWithStats.reduce((sum, w) => sum + (w._count?.contents || 0), 0)
    const totalQuizzes = workspacesWithStats.reduce((sum, w) => sum + (w._count?.quizzes || 0), 0)
    const totalFlashcards = workspacesWithStats.reduce((sum, w) => sum + (w._count?.flashcards || 0), 0)

    // Get all quiz attempts
    const { data: allQuizAttempts } = await supabaseAdmin
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', session.user.id)
      .order('completed_at', { ascending: false })

    const averageQuizScore =
      allQuizAttempts && allQuizAttempts.length > 0
        ? allQuizAttempts.reduce((sum, a) => sum + a.score, 0) / allQuizAttempts.length
        : 0

    // Get all flashcard reviews
    const { data: allFlashcardReviews } = await supabaseAdmin
      .from('flashcard_reviews')
      .select('*')
      .eq('user_id', session.user.id)

    const correctReviews = allFlashcardReviews?.filter((r) => r.result === "correct").length || 0
    const flashcardAccuracy =
      allFlashcardReviews && allFlashcardReviews.length > 0
        ? (correctReviews / allFlashcardReviews.length) * 100
        : 0

    // Study streaks
    const allProgress = await Promise.all(
      workspaces.map(w => getUserProgress(session.user.id, w.id))
    )
    const progressList = allProgress.filter(p => p !== null)
    const maxStreak = progressList.length > 0 ? Math.max(...progressList.map((p) => p!.streaks)) : 0

    // Recent activity
    const recentQuizzes = (allQuizAttempts || [])
      .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
      .slice(0, 5)

    return NextResponse.json({
      stats: {
        totalWorkspaces: workspaces.length,
        totalContents,
        totalQuizzes,
        totalFlashcards,
        averageQuizScore: Math.round(averageQuizScore),
        flashcardAccuracy: Math.round(flashcardAccuracy),
        maxStreak,
      },
      recentActivity: {
        quizzes: recentQuizzes.map((q) => ({
          id: q.id,
          score: q.score,
          completedAt: q.completed_at,
        })),
      },
      workspaces: workspacesWithStats.map((w) => ({
        id: w.id,
        name: w.name,
        stats: {
          contents: w._count?.contents || 0,
          quizzes: w._count?.quizzes || 0,
          flashcards: w._count?.flashcards || 0,
        },
        progress: w.progress?.[0] || null,
      })),
    })
  } catch (error: any) {
    console.error("Analytics fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    )
  }
}

