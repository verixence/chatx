export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth/middleware"
import { getChatSessionsByWorkspaceId } from "@/lib/db/queries"

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const workspaceId = searchParams.get("workspaceId")

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace ID is required" },
        { status: 400 }
      )
    }

    const sessions = await getChatSessionsByWorkspaceId(workspaceId, auth.userId)

    return NextResponse.json({ sessions: sessions.slice(0, 10) })
  } catch (error: any) {
    console.error("Chat sessions fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch chat sessions" },
      { status: 500 }
    )
  }
}

