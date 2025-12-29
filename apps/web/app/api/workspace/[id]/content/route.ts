import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth/middleware"
import { getContentsByWorkspaceId } from "@/lib/db/queries"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(req)
    const workspaceId = params.id

    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace ID required" }, { status: 400 })
    }

    const contents = await getContentsByWorkspaceId(workspaceId)
    console.log(`[Mobile API] Workspace ${workspaceId} has ${contents.length} contents:`, contents.map(c => ({ id: c.id, title: c.title, type: c.type })))

    return NextResponse.json(contents)
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
