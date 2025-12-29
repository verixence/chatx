import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth/middleware"
import { getFlashcardsByWorkspaceId, getFlashcardsByContentId } from "@/lib/db/queries"

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

    let flashcards
    if (contentId) {
      flashcards = await getFlashcardsByContentId(contentId)
    } else if (workspaceId) {
      flashcards = await getFlashcardsByWorkspaceId(workspaceId)
    }

    return NextResponse.json({ flashcards: flashcards || [] })
  } catch (error: any) {
    console.error("Error fetching flashcards:", error)
    return NextResponse.json(
      { error: "Failed to fetch flashcards" },
      { status: 500 }
    )
  }
}
