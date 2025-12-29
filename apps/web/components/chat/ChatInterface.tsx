"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Bot, Zap, Network, Search, Activity, BookOpen, Mic } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import SummaryPreview from "@/components/ui/SummaryPreview"

interface Message {
  role: "user" | "assistant"
  content: string
  references?: Array<{ text: string; metadata?: any; index: number }>
  timestamp?: string
  suggestedQuestions?: string[]
}

interface ChatInterfaceProps {
  workspaceId: string
  initialMessages?: Message[]
  chatSessionId?: string
  contentId?: string
  contentType?: "youtube" | "pdf" | "text" | "audio" | "video"
  onTimestampClick?: (timestamp: string) => void
  contextTitle?: string
  contextSubject?: string | null
  contextGrade?: number | null
  externalMessage?: string | null // When set, sends this message automatically
  onExternalMessageSent?: () => void // Callback when external message is sent
  setInputValue?: string | null // When set, fills the input field (doesn't send)
  onInputValueSet?: () => void // Callback when input value is set
  summaryPreview?: string | null // Optional summary to show as preview at top
  onViewFullSummary?: () => void // Callback when user wants to view full summary
}

export default function ChatInterface({
  workspaceId,
  initialMessages = [],
  chatSessionId,
  contentId,
  contentType,
  onTimestampClick,
  contextTitle,
  contextSubject,
  contextGrade,
  externalMessage,
  onExternalMessageSent,
  setInputValue,
  onInputValueSet,
  summaryPreview,
  onViewFullSummary,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState(chatSessionId)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const lastExternalMessageRef = useRef<string | null>(null)
  const lastInputValueRef = useRef<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const isSendingRef = useRef(false)
  const lastSentMessageRef = useRef<string | null>(null)

  // Initialize messages from initialMessages on mount - CRITICAL: Load on first mount
  const hasInitializedRef = useRef(false)
  const lastInitialMessagesRef = useRef<any[]>([])
  
  useEffect(() => {
    // On first mount or when session changes, load initialMessages
    if (!hasInitializedRef.current) {
      if (Array.isArray(initialMessages) && initialMessages.length > 0) {
        const formattedMessages = initialMessages.map((msg: any) => ({
          role: msg.role || "assistant",
          content: msg.content || msg.message || "",
          timestamp: msg.timestamp || msg.created_at || new Date().toISOString(),
          references: msg.references || msg.message_references || undefined,
        }))
        setMessages(formattedMessages)
        lastInitialMessagesRef.current = formattedMessages
        hasInitializedRef.current = true
        console.log(`[Chat] Initialized with ${formattedMessages.length} messages`)
      } else {
        // Even if empty, mark as initialized
        hasInitializedRef.current = true
      }
    }
    
    if (chatSessionId && chatSessionId !== currentSessionId) {
      setCurrentSessionId(chatSessionId)
      // When session changes, reload messages
      if (Array.isArray(initialMessages) && initialMessages.length > 0) {
        const formattedMessages = initialMessages.map((msg: any) => ({
          role: msg.role || "assistant",
          content: msg.content || msg.message || "",
          timestamp: msg.timestamp || msg.created_at || new Date().toISOString(),
          references: msg.references || msg.message_references || undefined,
        }))
        setMessages(formattedMessages)
        lastInitialMessagesRef.current = formattedMessages
      }
    }
  }, [chatSessionId, contentId]) // Only depend on session/content changes, not initialMessages
  
  // Sync with initialMessages when they update (new messages from server or refresh)
  // This handles cases where parent component refreshes with new messages
  useEffect(() => {
    if (!Array.isArray(initialMessages)) return
    
    const formattedMessages = initialMessages.map((msg: any) => ({
      role: msg.role || "assistant",
      content: msg.content || msg.message || "",
      timestamp: msg.timestamp || msg.created_at || new Date().toISOString(),
      references: msg.references || msg.message_references || undefined,
    }))
    
    // Check if initialMessages actually changed
    const messagesChanged = JSON.stringify(formattedMessages) !== JSON.stringify(lastInitialMessagesRef.current)
    
    if (messagesChanged && hasInitializedRef.current) {
      // Update if:
      // 1. We have more messages than current (new messages from server)
      // 2. We have same or fewer messages but content changed (refresh from server)
      // 3. Current messages are empty (should load from server)
      if (formattedMessages.length > messages.length || messages.length === 0) {
        // New messages or empty state - use server data
        setMessages(formattedMessages)
        lastInitialMessagesRef.current = formattedMessages
      } else if (formattedMessages.length === messages.length && messages.length > 0) {
        // Same length - check if content changed
        const currentLast = messages[messages.length - 1]
        const newLast = formattedMessages[formattedMessages.length - 1]
        if (currentLast && newLast && currentLast.content !== newLast.content) {
          // Content changed - use server data
          setMessages(formattedMessages)
          lastInitialMessagesRef.current = formattedMessages
        }
      } else if (formattedMessages.length < messages.length) {
        // Server has fewer messages - this shouldn't happen, but use server data as source of truth
        console.warn("[Chat] Server has fewer messages than local state, using server data")
        setMessages(formattedMessages)
        lastInitialMessagesRef.current = formattedMessages
      }
    } else if (!hasInitializedRef.current && formattedMessages.length > 0) {
      // First initialization
      setMessages(formattedMessages)
      lastInitialMessagesRef.current = formattedMessages
      hasInitializedRef.current = true
    }
  }, [initialMessages, messages.length])
  
  // Keep messages in sync with initialMessages (for when new messages arrive from server)
  // But preserve existing messages - only add new ones, never remove
  useEffect(() => {
    if (Array.isArray(initialMessages) && initialMessages.length > 0) {
      const formattedMessages = initialMessages.map((msg: any) => ({
        role: msg.role || "assistant",
        content: msg.content || msg.message || "",
        timestamp: msg.timestamp || msg.created_at || new Date().toISOString(),
        references: msg.references || msg.message_references || undefined,
      }))
      // Only update if we have more messages than current (new message added)
      // This preserves all existing messages including user messages
      if (formattedMessages.length > messages.length) {
        setMessages(formattedMessages)
      } else if (formattedMessages.length === messages.length && messages.length > 0) {
        // If same length, check if last message content changed (assistant response updated)
        const currentLast = messages[messages.length - 1]
        const newLast = formattedMessages[formattedMessages.length - 1]
        if (currentLast && newLast && currentLast.content !== newLast.content) {
          // Only update if the last message changed (assistant response updated)
          setMessages(formattedMessages)
        }
      } else if (messages.length === 0 && formattedMessages.length > 0) {
        // If we have no messages but initialMessages has messages, load them
        setMessages(formattedMessages)
      }
    } else if (messages.length === 0 && Array.isArray(initialMessages) && initialMessages.length === 0) {
      // Both are empty - this is fine, keep empty state
    }
  }, [initialMessages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    requestAnimationFrame(scrollToBottom)
  }, [messages])

  // Handle setInputValue (fill input field without sending)
  useEffect(() => {
    if (setInputValue && setInputValue !== lastInputValueRef.current) {
      lastInputValueRef.current = setInputValue
      setInput(setInputValue)
      // Focus the input field
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
      onInputValueSet?.()
    }
  }, [setInputValue, onInputValueSet])

  // Handle external message (from text selection)
  useEffect(() => {
    if (externalMessage && externalMessage !== lastExternalMessageRef.current && !loading) {
      lastExternalMessageRef.current = externalMessage
      // Simulate form submission with the external message
      const userMessage: Message = {
        role: "user",
        content: externalMessage,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, userMessage])
      setLoading(true)

      if (!contentId) {
        const errorMessage: Message = {
          role: "assistant",
          content: "Error: contentId is required for content-scoped chats",
          timestamp: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, errorMessage])
        setLoading(false)
        onExternalMessageSent?.()
        return
      }

      fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          message: externalMessage,
          contentId,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.answer) {
            const assistantMessage: Message = {
              role: "assistant",
              content: data.answer,
              references: data.references,
              timestamp: new Date().toISOString(),
            }
            setMessages((prev) => [...prev, assistantMessage])
          }
        })
        .catch((error) => {
          console.error("Error sending external message:", error)
          const errorMessage: Message = {
            role: "assistant",
            content: "Sorry, I encountered an error. Please try again.",
            timestamp: new Date().toISOString(),
          }
          setMessages((prev) => [...prev, errorMessage])
        })
        .finally(() => {
          setLoading(false)
          onExternalMessageSent?.()
        })
    }
  }, [externalMessage, contentId, workspaceId, loading, onExternalMessageSent])

  const sanitizeContent = (raw: string) =>
    raw
      .replace(/\[Source:\s*([0-9]{1,2}:[0-9]{2}(?::[0-9]{2})?|Page\s+\d+)\]/g, "")
      .replace(/\[(music|applause|laughter|silence|background noise)\]/gi, "")
      .replace(/^\s*\d{1,2}:\d{2}(?::\d{2})?\s*/gm, "")
      .trim()

  const renderMessageContent = (content: string | undefined | null, isUser: boolean) => {
    if (typeof content !== "string") return null
    const cleanedContent = sanitizeContent(content)
    
    if (isUser) {
      return <span className="text-[15px] text-white leading-[1.75]">{cleanedContent}</span>
    }

    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-4 text-[15px] text-[#353740] leading-[1.75] last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-outside ml-6 mb-4 space-y-2 text-[15px] text-[#353740] leading-[1.75]">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-outside ml-6 mb-4 space-y-2 text-[15px] text-[#353740] leading-[1.75]">{children}</ol>,
          li: ({ children }) => <li className="leading-[1.75]">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-[#202123]">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          code: ({ children }) => (
            <code className="bg-[#f4f4f5] text-[#202123] px-1.5 py-0.5 rounded text-[14px] font-mono border border-gray-200">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="bg-[#f4f4f5] border border-gray-200 p-4 rounded-lg overflow-x-auto text-[14px] my-4 leading-[1.5]">
              {children}
            </pre>
          ),
          h1: ({ children }) => <h1 className="text-lg font-bold mb-3 mt-6 first:mt-0 text-[#202123]">{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-semibold mb-2 mt-5 first:mt-0 text-[#202123]">{children}</h2>,
          h3: ({ children }) => <h3 className="text-[15px] font-semibold mb-2 mt-4 first:mt-0 text-[#202123]">{children}</h3>,
        }}
      >
        {cleanedContent}
      </ReactMarkdown>
    )
  }

  const onboardingMessage = (() => {
    const title = contextTitle || "this content"
    if (contentType === "pdf") {
      return `I'll help you study **${title}**. What part of this PDF should we focus on?`
    }
    if (contentType === "youtube") {
      return `This video is about **${title}**. Want me to jump to a topic or explain a segment?`
    }
    return `I'm ready to help with **${title}**. What would you like to explore?`
  })()

  const generateSuggestedQuestions = (lastMessage: string, contentType?: string): string[] => {
    const suggestions: string[] = []
    const title = contextTitle || "this content"
    
    // Analyze the last message to generate contextual suggestions
    const lowerMessage = lastMessage.toLowerCase()
    
    // Extract key topics from the message
    const hasPollution = lowerMessage.includes("pollution") || lowerMessage.includes("contaminat")
    const hasDefinition = lowerMessage.includes("what is") || lowerMessage.includes("definition")
    const hasExplanation = lowerMessage.includes("explain") || lowerMessage.includes("how")
    const hasTypes = lowerMessage.includes("type") || lowerMessage.includes("kind") || lowerMessage.includes("category")
    
    if (hasDefinition || hasExplanation) {
      suggestions.push(`Tell me more about this topic`)
      suggestions.push(`Give me examples`)
      suggestions.push(`What are the main types?`)
    } else if (hasTypes || hasPollution) {
      suggestions.push(`Explain each type in detail`)
      suggestions.push(`What are the effects?`)
      suggestions.push(`How can we prevent this?`)
    } else if (lowerMessage.includes("how") || lowerMessage.includes("why")) {
      suggestions.push(`Explain this step by step`)
      suggestions.push(`What causes this?`)
      suggestions.push(`Show me examples`)
    } else {
      // Default contextual suggestions
      if (contentType === "youtube") {
        suggestions.push(`Summarize the main points`)
        suggestions.push(`Explain the key concepts`)
        suggestions.push(`What should I remember?`)
      } else if (contentType === "pdf") {
        suggestions.push(`Explain the main topic`)
        suggestions.push(`What are the key concepts?`)
        suggestions.push(`Give me a summary`)
      } else {
        suggestions.push(`Explain this in detail`)
        suggestions.push(`What are the main points?`)
        suggestions.push(`Tell me more`)
      }
    }
    
    return suggestions.slice(0, 3)
  }

  const getQuickActions = (): string[] => {
    const title = contextTitle || "this content"
    if (contentType === "youtube") {
      return [
        `Summarize ${title}`,
        `Explain the main concepts`,
        `What are the key takeaways?`,
        `Create a quiz for me`
      ]
    } else if (contentType === "pdf") {
      return [
        `Explain the main topic`,
        `What are the key points?`,
        `Give me examples`,
        `Create flashcards`
      ]
    }
    return [
      `Explain this content`,
      `What should I focus on?`,
      `Give me a summary`,
      `Help me understand`
    ]
  }

  const sendMessage = async (messageText: string) => {
    const trimmedMessage = messageText.trim()
    
    // Prevent duplicate submissions
    if (loading || !trimmedMessage || isSendingRef.current) {
      return
    }
    
    // Prevent sending the same message twice in a row
    if (lastSentMessageRef.current === trimmedMessage) {
      return
    }
    
    isSendingRef.current = true
    lastSentMessageRef.current = trimmedMessage
    
    // Create user message
    const userMessage: Message = {
      role: "user",
      content: trimmedMessage,
      timestamp: new Date().toISOString(),
    }
    
    // Check for duplicates before adding
    setMessages((prev) => {
      const lastMessage = prev[prev.length - 1]
      if (lastMessage && lastMessage.role === "user" && lastMessage.content === trimmedMessage) {
        return prev // Don't add duplicate
      }
      return [...prev, userMessage]
    })
    
    setLoading(true)
    
    // Handle vague/off-topic checks
    if (isVagueInput(trimmedMessage)) {
      const clarifier = `I'm here to help with ${contextTitle || "this content"}. What do you want to focus on?`
      const assistantMessage: Message = {
        role: "assistant",
        content: clarifier,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setLoading(false)
      isSendingRef.current = false
      setTimeout(() => {
        lastSentMessageRef.current = null
      }, 1000)
      return
    }
    
    if (isOffTopic(trimmedMessage)) {
      const redirectMessage = getPlayfulRedirect()
      const assistantMessage: Message = {
        role: "assistant",
        content: redirectMessage,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setLoading(false)
      isSendingRef.current = false
      setTimeout(() => {
        lastSentMessageRef.current = null
      }, 1000)
      return
    }
    
    // Send to API
    try {
      if (!contentId) {
        throw new Error("contentId is required")
      }
      
      console.log("[Chat] Sending message to API:", trimmedMessage)
      
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          message: trimmedMessage,
          contentId,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }))
        throw new Error(errorData.error || `Failed to get response: ${response.status}`)
      }
      
      const data = await response.json()
      
      console.log("[Chat] Received response from API:", data)
      
      if (!data.answer) {
        throw new Error("No answer received from API")
      }
      
      const assistantMessage: Message = {
        role: "assistant",
        content: data.answer,
        references: data.references,
        timestamp: new Date().toISOString(),
        suggestedQuestions: generateSuggestedQuestions(data.answer, contentType),
      }
      
      // Check for duplicates before adding assistant message
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1]
        if (lastMessage && lastMessage.role === "assistant" && lastMessage.content === data.answer) {
          return prev // Don't add duplicate
        }
        return [...prev, assistantMessage]
      })
      
      if (data.chatSessionId) {
        setCurrentSessionId(data.chatSessionId)
      }
      
      // Scroll to bottom after message
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    } catch (error: any) {
      const errorMessage: Message = {
        role: "assistant",
        content: `Error: ${error.message || "Failed to process your message"}`,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
      isSendingRef.current = false
      // Reset last sent message after a delay to allow resending if needed
      setTimeout(() => {
        lastSentMessageRef.current = null
      }, 1000)
    }
  }

  const handleSuggestedQuestion = async (question: string) => {
    if (loading || isSendingRef.current) return
    
    // Check if this is a quiz or flashcard request and redirect to appropriate tab
    const lowerQuestion = question.toLowerCase()
    if (lowerQuestion.includes("create a quiz") || lowerQuestion.includes("create quiz") || lowerQuestion.includes("quiz for me")) {
      // This will be handled by parent component via a callback
      if ((window as any).onSwitchToQuizTab) {
        (window as any).onSwitchToQuizTab()
        return
      }
    }
    if (lowerQuestion.includes("create flashcards") || lowerQuestion.includes("create flashcard") || lowerQuestion.includes("flashcards for me")) {
      // This will be handled by parent component via a callback
      if ((window as any).onSwitchToFlashcardsTab) {
        (window as any).onSwitchToFlashcardsTab()
        return
      }
    }
    
    setInput("")
    await sendMessage(question)
  }

  const isVagueInput = (text: string) => {
    const trimmed = text.trim().toLowerCase()
    if (!trimmed) return true
    const greetings = ["hi", "hello", "hey", "yo", "sup", "hola"]
    if (greetings.includes(trimmed)) return true
    if (trimmed.length < 4) return true
    return false
  }

  const isOffTopic = (text: string): boolean => {
    const trimmed = text.trim().toLowerCase()
    
    // Joke patterns
    const jokePatterns = [
      /knock\s*knock/i,
      /why did the/i,
      /what do you call/i,
      /tell me a joke/i,
      /joke/i,
      /funny/i,
      /lol/i,
      /haha/i,
      /lmao/i,
    ]
    
    // Casual chat patterns
    const casualPatterns = [
      /how are you/i,
      /what's up/i,
      /whats up/i,
      /how's it going/i,
      /how are things/i,
      /what are you doing/i,
      /what do you like/i,
      /do you like/i,
      /favorite/i,
      /hobby/i,
      /hobbies/i,
    ]
    
    // Check for joke patterns
    if (jokePatterns.some(pattern => pattern.test(trimmed))) {
      return true
    }
    
    // Check for casual chat (but allow if it's about the content)
    const contentKeywords = [
      contextTitle?.toLowerCase(),
      contextSubject?.toLowerCase(),
      "explain", "understand", "learn", "study", "question", "help", "what", "how", "why", "when", "where"
    ].filter(Boolean)
    
    const hasContentKeyword = contentKeywords.some(keyword => 
      keyword && trimmed.includes(keyword)
    )
    
    // If it's casual chat but has content keywords, it's on-topic
    if (hasContentKeyword) {
      return false
    }
    
    // If it's casual chat without content keywords, it's off-topic
    if (casualPatterns.some(pattern => pattern.test(trimmed))) {
      return true
    }
    
    return false
  }

  const getPlayfulRedirect = (): string => {
    const title = contextTitle || "this content"
    const subject = contextSubject ? ` about ${contextSubject}` : ""
    
    const redirects = [
      `😊 I appreciate the chat! But I'm here to help you study **${title}**${subject}. What part would you like to explore?`,
      `🎯 That's fun, but let's get back to studying! I can help you understand **${title}**${subject}. What questions do you have?`,
      `📚 I'd love to chat more, but your studies are waiting! Let's focus on **${title}**${subject}. What would you like to learn?`,
      `✨ I'm here to make studying fun! Let's dive into **${title}**${subject}. What topic interests you?`,
      `🚀 Great energy! Now let's channel it into learning about **${title}**${subject}. What should we explore?`,
    ]
    
    return redirects[Math.floor(Math.random() * redirects.length)]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation() // Prevent double submission
    
    if (!input.trim() || loading || isSendingRef.current) return

    const currentInput = input.trim()
    setInput("")
    
    // Use sendMessage which handles all the logic including adding user message
    await sendMessage(currentInput)
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-white" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif" }}>
      {/* Messages Area - Scrollable */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 min-h-0 pb-24"
        style={{ 
          lineHeight: "1.75",
          scrollBehavior: "smooth"
        }}
      >
        {/* Summary Preview - Show at top when available and no messages yet */}
        {messages.length === 0 && summaryPreview && (
          <div className="max-w-3xl mx-auto mb-6">
            <SummaryPreview 
              summary={summaryPreview} 
              onViewFull={onViewFullSummary}
            />
          </div>
        )}
        
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <div className="text-center space-y-4 px-4 max-w-2xl">
              <p className="text-base text-gray-800 leading-relaxed">{onboardingMessage}</p>
              {contextSubject && (
                <p className="text-sm text-gray-500">
                  Subject: {contextSubject}
                  {contextGrade ? ` • Grade ${contextGrade}` : ""}
                </p>
              )}
              {/* Quick Action Buttons */}
              <div className="flex flex-wrap gap-2 sm:gap-2.5 justify-center mt-6 sm:mt-8">
                {getQuickActions().slice(0, 4).map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestedQuestion(action)}
                    className="px-4 py-2.5 sm:px-5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-full hover:bg-gradient-to-r hover:from-[#EFA07F]/5 hover:to-[#EFA07F]/10 hover:border-[#EFA07F]/30 hover:text-gray-900 transition-all duration-200 shadow-sm hover:shadow-md min-h-[44px] touch-manipulation"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 max-w-3xl mx-auto">
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex items-start gap-4",
                  message.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                {/* Avatar */}
                {message.role === "assistant" && (
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border border-gray-200">
                      <Bot className="h-4.5 w-4.5 text-gray-700" />
                    </div>
                  </div>
                )}
                {message.role === "user" && (
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <span className="text-white text-xs font-semibold">U</span>
                    </div>
                  </div>
                )}

                {/* Message Content */}
                <div className={cn(
                  "flex-1 min-w-0",
                  message.role === "user" ? "flex justify-end" : "flex justify-start"
                )}>
                  <div className="flex flex-col gap-2 max-w-[85%]">
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-3 break-words",
                        message.role === "user"
                          ? "bg-[#2563eb] text-white shadow-sm"
                          : "bg-[#f7f7f8] text-[#353740] border border-gray-200/50"
                      )}
                      style={{ 
                        borderRadius: "18px",
                        wordWrap: "break-word",
                        overflowWrap: "break-word"
                      }}
                    >
                      <div className="text-[15px] leading-[1.75]">
                        {renderMessageContent(message.content, message.role === "user")}
                      </div>
                    </div>
                    {/* Suggested Questions for Assistant Messages */}
                    {message.role === "assistant" && idx === messages.length - 1 && !loading && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {generateSuggestedQuestions(message.content, contentType).map((suggestion, sugIdx) => (
                          <button
                            key={sugIdx}
                            onClick={() => handleSuggestedQuestion(suggestion)}
                            className="px-3.5 py-2 text-xs sm:text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-full hover:bg-gradient-to-r hover:from-[#EFA07F]/5 hover:to-[#EFA07F]/10 hover:border-[#EFA07F]/30 hover:text-gray-900 transition-all duration-200 shadow-sm hover:shadow min-h-[36px] sm:min-h-[32px] touch-manipulation"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border border-gray-200">
                    <Bot className="h-4.5 w-4.5 text-gray-700" />
                  </div>
                </div>
                <div className="bg-[#f7f7f8] rounded-2xl px-4 py-3 border border-gray-200/50">
                  <div className="flex space-x-1.5">
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - sticky bottom */}
      <div className="border-t border-gray-200 bg-white flex-shrink-0 sticky bottom-0">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <form onSubmit={handleSubmit} className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message ChatX..."
                className="w-full min-h-[52px] max-h-[200px] px-4 py-3 pr-12 rounded-2xl border border-gray-300 focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] text-[15px] leading-[1.5] resize-none bg-white text-gray-900 placeholder-gray-500"
                style={{ 
                  borderRadius: "24px",
                  fontFamily: "inherit"
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    e.stopPropagation()
                    if (!loading && !isSendingRef.current && input.trim()) {
                      handleSubmit(e)
                    }
                  }
                }}
                disabled={loading}
                rows={1}
                onInput={(e: any) => {
                  e.target.style.height = 'auto'
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`
                }}
              />
            </div>
            <Button 
              type="submit" 
              disabled={loading || !input.trim()}
              className="h-[52px] w-[52px] rounded-2xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              size="icon"
              style={{ borderRadius: "24px" }}
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
