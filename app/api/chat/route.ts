import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { getWorkspaceById, getProcessedContentByContentId, getUserById, getOrCreateChatSessionByContentId, updateChatSession, getContentById } from "@/lib/db/queries"
import { createRAGChain, vectorSemanticSearch } from "@/lib/ai/rag"
import { getDefaultProvider } from "@/lib/ai/providers"
import { moderateUserInput, moderateAIOutput, getSafeErrorMessage } from "@/lib/safety/moderation"
import { logSafetyEvent } from "@/lib/safety/logging"
import { isTrialExpired, getSubscriptionLimits } from "@/lib/subscriptions/subscription"
import { canMakeAIRequest, incrementAIRequestCount } from "@/lib/db/usage-tracking"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { workspaceId, message, contentId } = await req.json()

    // MANDATORY: contentId is required for content-scoped chats
    if (!contentId) {
      return NextResponse.json(
        { error: "contentId is required for content-scoped chats" },
        { status: 400 }
      )
    }

    if (!workspaceId || !message) {
      return NextResponse.json(
        { error: "Workspace ID and message are required" },
        { status: 400 }
      )
    }

    // Content Safety: Moderate user input
    const inputModeration = moderateUserInput(message)
    if (!inputModeration.allowed) {
      logSafetyEvent({
        type: 'input_blocked',
        userId: session.user.id,
        workspaceId,
        contentId,
        severity: inputModeration.severity || 'medium',
        reason: inputModeration.reason,
        metadata: { originalMessage: message.substring(0, 100) }, // Log first 100 chars only
      })
      return NextResponse.json(
        { 
          error: inputModeration.reason || getSafeErrorMessage(inputModeration.severity || 'medium'),
          code: 'CONTENT_MODERATION',
        },
        { status: 400 }
      )
    } else if (inputModeration.sanitized && inputModeration.sanitized !== message) {
      // Log if input was sanitized (lower severity)
      logSafetyEvent({
        type: 'input_moderated',
        userId: session.user.id,
        workspaceId,
        contentId,
        severity: 'low',
        reason: 'Input sanitized',
      })
    }

    // Use sanitized message if available
    const sanitizedMessage = inputModeration.sanitized || message

    // Get workspace
    const workspace = await getWorkspaceById(workspaceId)
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    // Check access
    if (workspace.user_id !== session.user.id && !workspace.shared) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get the specific content - ONLY this content
    const content = await getContentById(contentId)
    if (!content || content.workspace_id !== workspaceId) {
      return NextResponse.json(
        { error: "Content not found in this workspace" },
        { status: 404 }
      )
    }

    // Runtime check: ensure content is ready
    if (content.status !== "complete" && content.status !== "ready" && content.status !== "partial") {
      return NextResponse.json(
        { error: "This content is still processing. Please try again in a moment." },
        { status: 400 }
      )
    }

    // Get or create chat session scoped to THIS content only
    const chatSession = await getOrCreateChatSessionByContentId(contentId, workspaceId, session.user.id)

    // Runtime check: verify session is scoped to this content
    if (chatSession.content_id !== contentId) {
      throw new Error(`Chat session content_id mismatch: expected ${contentId}, got ${chatSession.content_id}`)
    }

    // Get chunks from ONLY this content
    const processed = await getProcessedContentByContentId(contentId)
    if (!processed || !Array.isArray(processed.chunks) || processed.chunks.length === 0) {
      return NextResponse.json({
        answer: "This content doesn't have any processed text yet. Please wait for processing to complete.",
        references: [],
      })
    }

    const chunks = processed.chunks as any[]
    const embeddings = Array.isArray(processed.embeddings) && processed.embeddings.length === chunks.length
      ? (processed.embeddings as number[][])
      : null

    // Get user's AI provider preference
    const user = await getUserById(session.user.id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if trial has expired
    if (user.subscription_status === 'trial' && isTrialExpired(user.subscription_status, user.subscription_end_date)) {
      return NextResponse.json(
        { 
          error: 'Your 14-day free trial has ended. Please upgrade to Pro to continue using chat features.',
          code: 'TRIAL_EXPIRED'
        },
        { status: 403 }
      )
    }

    // Check daily AI request limit for freemium users
    const subscriptionTier = (user.subscription as 'freemium' | 'pro' | 'enterprise') || 'freemium'
    const limits = getSubscriptionLimits(subscriptionTier)
    
    if (limits.maxAIRequestsPerDay) {
      const limitCheck = await canMakeAIRequest(session.user.id, subscriptionTier, limits.maxAIRequestsPerDay)
      
      if (!limitCheck.allowed) {
        return NextResponse.json(
          {
            error: limitCheck.reason || 'Daily AI request limit reached',
            code: 'DAILY_LIMIT_EXCEEDED',
            current: limitCheck.current,
            limit: limitCheck.limit,
          },
          { status: 403 }
        )
      }
    }

    const provider = (user.ai_provider as any) || getDefaultProvider()

    // Load chat history for conversation context
    const { getChatMessages } = await import("@/lib/db/queries")
    const chatHistory = await getChatMessages(chatSession.id)
    const conversationHistory = chatHistory
      .slice(-10) // Last 10 messages for context (5 exchanges)
      .map((msg: any) => ({
        role: msg.role,
        content: msg.message || msg.content || "",
      }))

    // Perform semantic search on ONLY this content's chunks
    // Use the full conversation context for better search
    const searchQuery = conversationHistory.length > 0
      ? `${conversationHistory.map(m => m.content).join(" ")} ${sanitizedMessage}`
      : sanitizedMessage
    const relevantChunks = await vectorSemanticSearch(chunks, embeddings, searchQuery, 8) // Increased to 8 chunks

    // Create RAG chain with conversation history
    const { answer, references } = await createRAGChain(sanitizedMessage, relevantChunks, {
      workspaceId,
      userId: session.user.id,
      provider,
      conversationHistory, // Pass chat history for context
      contentTitle: content.title || (content.metadata as any)?.title,
      contentType: content.type,
    })

    // Content Safety: Moderate AI output
    const outputModeration = moderateAIOutput(answer)
    if (!outputModeration.allowed) {
      logSafetyEvent({
        type: 'output_blocked',
        userId: session.user.id,
        workspaceId,
        contentId,
        severity: outputModeration.severity || 'high',
        reason: outputModeration.reason,
        metadata: { answerLength: answer.length },
      })
      return NextResponse.json(
        { 
          error: "I apologize, but I can't provide that response. Please try asking a different question related to your learning materials.",
          code: 'OUTPUT_MODERATION',
        },
        { status: 500 }
      )
    } else if (outputModeration.sanitized && outputModeration.sanitized !== answer) {
      // Log if output was sanitized (lower severity)
      logSafetyEvent({
        type: 'output_moderated',
        userId: session.user.id,
        workspaceId,
        contentId,
        severity: 'low',
        reason: 'Output sanitized',
      })
    }

    // Use sanitized answer if available
    const sanitizedAnswer = outputModeration.sanitized || answer

    // Increment AI request count for usage tracking
    await incrementAIRequestCount(session.user.id).catch((err) => {
      console.warn("Failed to increment AI request count:", err)
      // Don't fail the request if usage tracking fails
    })

    // Store messages in chat_messages table (primary storage)
    // Also update session.messages as fallback for backward compatibility
    try {
      const { addChatMessage } = await import("@/lib/db/queries")
      // Store in chat_messages table (preferred)
      await addChatMessage(chatSession.id, "user", sanitizedMessage)
      await addChatMessage(chatSession.id, "assistant", sanitizedAnswer, references)
      
      // Also update session.messages as fallback
      const messages = (chatSession.messages as any[]) || []
      messages.push(
        { role: "user", content: sanitizedMessage, timestamp: new Date().toISOString() },
        { role: "assistant", content: sanitizedAnswer, references, timestamp: new Date().toISOString() }
      )
      await updateChatSession(chatSession.id, { messages }).catch((err) => {
        console.warn("Failed to update session.messages:", err)
      })
    } catch (error) {
      // Fallback to storing in session.messages only if chat_messages table doesn't exist
      console.warn("chat_messages table not available, using session.messages only:", error)
      const messages = (chatSession.messages as any[]) || []
      messages.push(
        { role: "user", content: sanitizedMessage, timestamp: new Date().toISOString() },
        { role: "assistant", content: sanitizedAnswer, references, timestamp: new Date().toISOString() }
      )
      await updateChatSession(chatSession.id, { messages })
    }

    return NextResponse.json({
      answer: sanitizedAnswer,
      references,
      chatSessionId: chatSession.id,
    })
  } catch (error: any) {
    console.error("Chat error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to process chat message" },
      { status: 500 }
    )
  }
}

