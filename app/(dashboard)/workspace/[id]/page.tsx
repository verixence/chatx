import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { redirect, notFound } from "next/navigation"
import { getWorkspaceById, getContentsByWorkspaceId, getProcessedContentByContentId } from "@/lib/db/queries"
import WorkspaceView from "@/components/workspace/WorkspaceView"

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string }
}) {
  // Session is already checked in layout
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect("/login")
  }

  // Resolve params (Next.js 15+ compatibility)
  const resolvedParams = await Promise.resolve(params)
  const workspaceId = resolvedParams.id

  // Handle "new" route - redirect to new workspace page
  if (workspaceId === "new") {
    redirect("/workspace/new")
  }

  // Optimize: Fetch workspace first, then contents in parallel
  const workspace = await getWorkspaceById(workspaceId)

  if (!workspace) {
    notFound()
  }

  if (workspace.user_id !== session.user.id && !workspace.shared) {
    redirect("/dashboard")
  }

  // Optimize: Fetch all contents first, then batch fetch processed content
  const contents = await getContentsByWorkspaceId(workspaceId)
  
  // Batch fetch processed content in parallel (limit concurrency for better performance)
  const contentsWithProcessed = await Promise.all(
    contents.map(async (content) => {
      const processed = await getProcessedContentByContentId(content.id)
      return { ...content, processed }
    })
  )

  return <WorkspaceView workspace={{ ...workspace, contents: contentsWithProcessed }} userId={session.user.id} />
}

