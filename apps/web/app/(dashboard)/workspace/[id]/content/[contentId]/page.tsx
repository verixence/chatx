import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { redirect, notFound } from "next/navigation"
import {
  getWorkspaceById,
  getContentById,
  getProcessedContentByContentId,
  getQuizzesByWorkspaceId,
  getFlashcardsByWorkspaceId,
  getOrCreateChatSessionByContentId,
  getChatMessages,
} from "@/lib/db/queries"
import ContentDetailClient from "./ContentDetailClient"

// Force dynamic rendering for fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function fetchYouTubeTitle(videoId: string | undefined | null): Promise<string | null> {
  if (!videoId) return null
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return null

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`
    )
    if (!res.ok) return null
    const data = await res.json()
    const item = data.items?.[0]
    return item?.snippet?.title || null
  } catch {
    return null
  }
}

export default async function ContentDetailPage({
  params,
}: {
  params: { id: string; contentId: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect("/login")
  }

  // Get workspace to verify access
  const workspace = await getWorkspaceById(params.id)
  if (!workspace) {
    notFound()
  }

  if (workspace.user_id !== session.user.id && !workspace.shared) {
    redirect("/dashboard")
  }

  // Get content
  const content = await getContentById(params.contentId)
  if (!content || content.workspace_id !== params.id) {
    notFound()
  }

  // Get processed content
  const processed = await getProcessedContentByContentId(params.contentId)

  const [quizzes, flashcards] = await Promise.all([
    getQuizzesByWorkspaceId(params.id),
    getFlashcardsByWorkspaceId(params.id),
  ])

  const videoId =
    content.type === "youtube" && typeof content.metadata === "object"
      ? content.metadata?.videoId
      : null
  const videoTitle = await fetchYouTubeTitle(videoId)

  // Load chat history scoped to THIS content only
  const chatSession = await getOrCreateChatSessionByContentId(params.contentId, params.id, session.user.id)
  if (chatSession.content_id && chatSession.content_id !== params.contentId) {
    throw new Error(`Chat session content_id mismatch: expected ${params.contentId}, got ${chatSession.content_id}`)
  }
  
  // Load messages from chat_messages table, fallback to session.messages if table doesn't exist
  let initialMessages: any[] = []
  try {
    const chatMessages = await getChatMessages(chatSession.id)
    if (chatMessages && chatMessages.length > 0) {
      // Use messages from chat_messages table (preferred)
      initialMessages = chatMessages.map((msg: any) => ({
        role: msg.role || "assistant",
        content: msg.message || msg.content || "",
        timestamp: msg.created_at || msg.timestamp || new Date().toISOString(),
        references: msg.message_references || msg.references || undefined,
      }))
    } else {
      // Fallback to session.messages if chat_messages table is empty
      const sessionMessages = (chatSession.messages as any[]) || []
      if (sessionMessages.length > 0) {
        initialMessages = sessionMessages.map((msg: any) => ({
          role: msg.role || "assistant",
          content: msg.content || msg.message || "",
          timestamp: msg.timestamp || new Date().toISOString(),
          references: msg.references || undefined,
        }))
      }
    }
  } catch (error) {
    // Fallback to session.messages if chat_messages table doesn't exist
    console.warn("Could not load from chat_messages table, using session.messages:", error)
    const sessionMessages = (chatSession.messages as any[]) || []
    if (sessionMessages.length > 0) {
      initialMessages = sessionMessages.map((msg: any) => ({
        role: msg.role || "assistant",
        content: msg.content || msg.message || "",
        timestamp: msg.timestamp || new Date().toISOString(),
        references: msg.references || undefined,
      }))
    }
  }
  
  const chatSessionId = chatSession.id

  return (
    <ContentDetailClient
      workspaceId={params.id}
      content={content}
      processed={processed}
      quizzes={quizzes}
      flashcards={flashcards}
      videoTitle={videoTitle}
      initialChatMessages={initialMessages}
      chatSessionId={chatSessionId}
    />
  )
}

