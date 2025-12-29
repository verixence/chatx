import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth/middleware"
import { getWorkspaceById, updateWorkspace } from "@/lib/db/queries"
import { randomBytes } from "crypto"

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(req)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const workspace = await getWorkspaceById(params.id)

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    if (workspace.user_id !== auth.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Generate share token
    const shareToken = randomBytes(32).toString("hex")

    const updated = await updateWorkspace(params.id, {
      shared: true,
      share_token: shareToken,
    })

    if (!updated) {
      return NextResponse.json(
        { error: "Failed to update workspace" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      shareToken,
      shareUrl: `${process.env.NEXTAUTH_URL}/workspace/${params.id}?token=${shareToken}`,
    })
  } catch (error: any) {
    console.error("Workspace share error:", error)
    return NextResponse.json(
      { error: "Failed to share workspace" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(req)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const workspace = await getWorkspaceById(params.id)

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    if (workspace.user_id !== auth.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await updateWorkspace(params.id, {
      shared: false,
      share_token: null,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Workspace unshare error:", error)
    return NextResponse.json(
      { error: "Failed to unshare workspace" },
      { status: 500 }
    )
  }
}

