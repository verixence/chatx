import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { getWorkspaceById, getContentsByWorkspaceId, getQuizzesByWorkspaceId, getFlashcardsByWorkspaceId, getUserProgress, deleteWorkspace, getProcessedContentByContentId, deleteContent } from "@/lib/db/queries"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const workspace = await getWorkspaceById(params.id)

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    // Check access
    if (workspace.user_id !== session.user.id && !workspace.shared) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get related data
    const contents = await getContentsByWorkspaceId(params.id)
    const contentsWithProcessed = await Promise.all(
      contents.map(async (content) => {
        const processed = await getProcessedContentByContentId(content.id)
        return { ...content, processed }
      })
    )

    const quizzes = await getQuizzesByWorkspaceId(params.id)
    const flashcards = await getFlashcardsByWorkspaceId(params.id)
    const progress = await getUserProgress(session.user.id, params.id)

    return NextResponse.json({
      workspace: {
        ...workspace,
        contents: contentsWithProcessed,
        quizzes,
        flashcards,
        progress: progress ? [progress] : [],
      },
    })
  } catch (error: any) {
    console.error("Workspace fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch workspace" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const workspace = await getWorkspaceById(params.id)

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    if (workspace.user_id !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check if this is a content deletion request
    let body: { contentId?: string } = {}
    try {
      body = await req.json()
    } catch {
      // No body, delete entire workspace
    }

    if (body.contentId) {
      // Delete specific content
      const success = await deleteContent(body.contentId)
      if (!success) {
        return NextResponse.json(
          { error: "Failed to delete content" },
          { status: 500 }
        )
      }
      return NextResponse.json({ success: true, deleted: "content" })
    }

    // Delete entire workspace
    const success = await deleteWorkspace(params.id)

    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete workspace" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, deleted: "workspace" })
  } catch (error: any) {
    console.error("Workspace deletion error:", error)
    return NextResponse.json(
      { error: "Failed to delete workspace" },
      { status: 500 }
    )
  }
}

