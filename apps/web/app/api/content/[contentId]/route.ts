import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth/middleware"
import { getContentById } from "@/lib/db/queries"

/**
 * GET /api/content/[contentId]
 * Returns a specific content item by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { contentId: string } }
) {
  try {
    const auth = await authenticateRequest(req)
    const contentId = params.contentId

    if (!contentId) {
      return NextResponse.json({ error: "Content ID required" }, { status: 400 })
    }

    const content = await getContentById(contentId)

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 })
    }

    // TODO: Verify that the content belongs to the authenticated user's workspace
    // For now, we'll return the content
    return NextResponse.json(content)
  } catch (error: any) {
    console.error("Content fetch error:", error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    )
  }
}
