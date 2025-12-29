import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth/middleware"
import { getWorkspacesByUserId, createWorkspace, getContentsByWorkspaceId } from "@/lib/db/queries"
import { supabaseAdmin } from "@/lib/db/supabase"

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req)
    const workspaces = await getWorkspacesByUserId(auth.userId)
    
    // Get counts and recent contents for each workspace
    const workspacesWithDetails = await Promise.all(
      workspaces.map(async (workspace) => {
        const contents = await getContentsByWorkspaceId(workspace.id)
        
        // Get counts
        const { count: contentsCount } = await supabaseAdmin
          .from('contents')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspace.id)
        
        const { count: quizzesCount } = await supabaseAdmin
          .from('quizzes')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspace.id)
        
        const { count: flashcardsCount } = await supabaseAdmin
          .from('flashcards')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspace.id)

        return {
          ...workspace,
          contents: contents.slice(0, 5),
          _count: {
            contents: contentsCount || 0,
            quizzes: quizzesCount || 0,
            flashcards: flashcardsCount || 0,
          },
        }
      })
    )

    return NextResponse.json({ workspaces: workspacesWithDetails })
  } catch (error: any) {
    console.error("Workspace fetch error:", error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Failed to fetch workspaces" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req)
    const { name, description, tags } = await req.json()

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const workspace = await createWorkspace({
      user_id: auth.userId,
      name,
      description: description || undefined,
      tags: tags || [],
    })

    if (!workspace) {
      return NextResponse.json(
        { error: "Failed to create workspace" },
        { status: 500 }
      )
    }

    return NextResponse.json({ workspace })
  } catch (error: any) {
    console.error("Workspace creation error:", error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Failed to create workspace" },
      { status: 500 }
    )
  }
}

