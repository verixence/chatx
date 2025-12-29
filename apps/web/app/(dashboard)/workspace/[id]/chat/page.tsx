import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { redirect, notFound } from "next/navigation"
import { getWorkspaceById, getChatSessionsByWorkspaceId, getContentById } from "@/lib/db/queries"
import ChatInterface from "@/components/chat/ChatInterface"

export default async function ChatPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams?: { contentId?: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect("/login")
  }

  const workspace = await getWorkspaceById(params.id)

  if (!workspace) {
    notFound()
  }

  if (workspace.user_id !== session.user.id && !workspace.shared) {
    redirect("/dashboard")
  }

  const contentId = searchParams?.contentId

  let heading = `Chat with ${workspace.name}`
  let subheading = "Ask questions about your learning materials"
  let initialMessages: any[] = []
  let chatSessionId: string | undefined
  let contentType: "youtube" | "pdf" | "text" | "audio" | "video" | undefined

  if (contentId) {
    // Content-specific chat: verify content belongs to this workspace
    const content = await getContentById(contentId)
    if (content && content.workspace_id === params.id) {
      contentType = content.type as any
      const contentLabel =
        content.type === "youtube"
          ? "this video"
          : content.type === "pdf"
          ? "this document"
          : "this content"
      heading = `Chat about ${contentLabel}`
      subheading = "Ask questions specifically about this upload."
      // Do NOT preload workspace-wide chat history; start fresh for this content
    }
  } else {
    // Workspace-level chat: load existing session if any
    const chatSessions = await getChatSessionsByWorkspaceId(params.id, session.user.id)
    initialMessages = chatSessions[0]?.messages || []
    chatSessionId = chatSessions[0]?.id
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{heading}</h1>
        <p className="text-muted-foreground mt-2">{subheading}</p>
      </div>
      <ChatInterface
        workspaceId={params.id}
        initialMessages={initialMessages}
        chatSessionId={chatSessionId}
        contentId={contentId}
        contentType={contentType}
      />
    </div>
  )
}

