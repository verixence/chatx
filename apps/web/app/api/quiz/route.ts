import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth/middleware"
import { getQuizzesByWorkspaceId, getQuizzesByContentId } from "@/lib/db/queries"

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const workspaceId = searchParams.get('workspaceId')
    const contentId = searchParams.get('contentId')

    if (!workspaceId && !contentId) {
      return NextResponse.json(
        { error: "workspaceId or contentId is required" },
        { status: 400 }
      )
    }

    let quizzes
    if (contentId) {
      quizzes = await getQuizzesByContentId(contentId)
    } else if (workspaceId) {
      quizzes = await getQuizzesByWorkspaceId(workspaceId)
    }

    return NextResponse.json({ quizzes: quizzes || [] })
  } catch (error: any) {
    console.error("Error fetching quizzes:", error)
    return NextResponse.json(
      { error: "Failed to fetch quizzes" },
      { status: 500 }
    )
  }
}
