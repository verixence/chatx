import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth/middleware"
import { getContentById, getOrCreateChatSessionByContentId, getChatMessages } from "@/lib/db/queries"

export async function GET(
  req: NextRequest,
  { params }: { params: { contentId: string } }
) {
  try {
    const auth = await authenticateRequest(req)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const content = await getContentById(params.contentId)
    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 })
    }

    // Get or create chat session
    const workspaceId = content.workspace_id
    const chatSession = await getOrCreateChatSessionByContentId(params.contentId, workspaceId, auth.userId)
    
    // Load messages from chat_messages table
    let messages: any[] = []
    try {
      const chatMessages = await getChatMessages(chatSession.id)
      if (chatMessages && chatMessages.length > 0) {
        messages = chatMessages.map((msg: any) => ({
          role: msg.role || "assistant",
          content: msg.message || msg.content || "",
          timestamp: msg.created_at || msg.timestamp || new Date().toISOString(),
          references: msg.message_references || msg.references || undefined,
        }))
      } else {
        // Fallback to session.messages
        const sessionMessages = (chatSession.messages as any[]) || []
        if (sessionMessages.length > 0) {
          messages = sessionMessages.map((msg: any) => ({
            role: msg.role || "assistant",
            content: msg.content || msg.message || "",
            timestamp: msg.timestamp || new Date().toISOString(),
            references: msg.references || undefined,
          }))
        }
      }
    } catch (error) {
      console.warn("Error loading chat messages:", error)
      // Fallback to session.messages
      const sessionMessages = (chatSession.messages as any[]) || []
      if (sessionMessages.length > 0) {
        messages = sessionMessages.map((msg: any) => ({
          role: msg.role || "assistant",
          content: msg.content || msg.message || "",
          timestamp: msg.timestamp || new Date().toISOString(),
          references: msg.references || undefined,
        }))
      }
    }

    return NextResponse.json({
      messages,
      chatSessionId: chatSession.id,
    })
  } catch (error: any) {
    console.error("Error fetching chat messages:", error)
    return NextResponse.json(
      { error: "Failed to fetch chat messages" },
      { status: 500 }
    )
  }
}

