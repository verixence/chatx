import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { redirect } from "next/navigation"
import { getWorkspacesByUserId } from "@/lib/db/queries"
import { supabaseAdmin } from "@/lib/db/supabase"
import DashboardContent from "@/components/dashboard/DashboardContent"

// Force dynamic rendering - no caching for dashboard
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect("/login")
  }

  // Get all workspaces for the user
  const workspaces = await getWorkspacesByUserId(session.user.id)
  
  // Get all content across all workspaces
  const workspaceIds = workspaces.map(w => w.id)
  let allContents: any[] = []
  
  if (workspaceIds.length > 0) {
    const { data, error } = await supabaseAdmin
      .from('contents')
      .select('*')
      .in('workspace_id', workspaceIds)
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      allContents = data
    }
  }

  // Get or create default workspace for uploads
  let defaultWorkspace = workspaces.find(w => w.name === "My Workspace") || workspaces[0]
  
  // If no workspace exists, create a default one
  if (!defaultWorkspace) {
    const { data: newWorkspace, error } = await supabaseAdmin
      .from('workspaces')
      .insert({
        user_id: session.user.id,
        name: "My Workspace",
        description: "Default workspace"
      })
      .select()
      .single()
    
    if (!error && newWorkspace) {
      defaultWorkspace = newWorkspace
    }
  }

  return <DashboardContent contents={allContents} userId={session.user.id} defaultWorkspaceId={defaultWorkspace?.id || ""} />
}
