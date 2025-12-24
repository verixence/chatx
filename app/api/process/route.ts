import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { getContentById, getProcessedContentByContentId, updateProcessedContent, updateContent, getUserById, createProcessedContent } from "@/lib/db/queries"
import { createSummarizationChain } from "@/lib/ai/chains"
import { generateEmbeddings } from "@/lib/ai/embeddings"
import { getDefaultProvider } from "@/lib/ai/providers"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { contentId } = await req.json()
    console.log(`[PROCESS] Starting processing for content: ${contentId}`)

    if (!contentId) {
      return NextResponse.json({ error: "Content ID required" }, { status: 400 })
    }

    // Get content
    const content = await getContentById(contentId)

    if (!content) {
      console.log(`[PROCESS] Content not found: ${contentId}`)
      return NextResponse.json({ error: "Content not found" }, { status: 404 })
    }
    
    console.log(`[PROCESS] Content found: ${contentId}, type=${content.type}, status=${content.status}, textLength=${content.extracted_text?.length || 0}`)

    // If content has no extracted text, try to recover it
    if (!content.extracted_text || content.extracted_text.trim().length === 0) {
      // First, try to reconstruct from processed content chunks
      const processedContent = await getProcessedContentByContentId(contentId)
      if (processedContent && Array.isArray(processedContent.chunks) && processedContent.chunks.length > 0) {
        const reconstructedText = (processedContent.chunks as any[])
          .map((chunk) => chunk.text)
          .join(" ")
        
        if (reconstructedText && reconstructedText.trim().length > 0) {
          // Update content with reconstructed text
          await updateContent(contentId, { extracted_text: reconstructedText })
          content.extracted_text = reconstructedText
          console.log("Reconstructed extracted_text from chunks")
        }
      }
      
      // If still no text, try to re-extract from YouTube
      if ((!content.extracted_text || content.extracted_text.trim().length === 0) && content.type === "youtube" && content.raw_url) {
        try {
          const { getYouTubeTranscript, extractVideoId } = await import("@/lib/ingestion/youtube")
          const videoId = extractVideoId(content.raw_url)
          if (videoId) {
            // Re-extract transcript using available methods
            const transcriptData = await getYouTubeTranscript(videoId, { videoUrl: content.raw_url })
            const newExtractedText = transcriptData.transcript
            
            if (newExtractedText && newExtractedText.trim().length > 0) {
              // Update content with extracted text
              await updateContent(contentId, { 
                extracted_text: newExtractedText,
                metadata: { ...(content.metadata || {}), ...transcriptData.metadata }
              })
              // Update content reference
              content.extracted_text = newExtractedText
              console.log("Re-extracted text from YouTube")
            } else {
              return NextResponse.json(
                { 
                  error: "This video has no captions/transcript available",
                  details: "The video may not have captions enabled. Please try a different video with captions."
                },
                { status: 400 }
              )
            }
          }
        } catch (reExtractError: any) {
          console.error("Error re-extracting YouTube transcript:", reExtractError)
          return NextResponse.json(
            { 
              error: "Content has no extracted text and could not be re-extracted",
              details: reExtractError.message || "Video may not have captions available. Please try a different video."
            },
            { status: 400 }
          )
        }
      }
      
      // Final check - if still no text, return error
      if (!content.extracted_text || content.extracted_text.trim().length === 0) {
        return NextResponse.json(
          { 
            error: "Content has no extracted text",
            details: "The content was ingested but no text could be extracted. Please re-upload the content or try a different source."
          },
          { status: 400 }
        )
      }
    }

    // Get user's AI provider preference
    const user = await getUserById(session.user.id)

    const provider = (user?.ai_provider as any) || getDefaultProvider()

    // Generate summary
    console.log(`[PROCESS] Summary generation started for content: ${contentId}`)
    let summary
    try {
      summary = await createSummarizationChain(
        content.extracted_text,
        provider,
        session.user.id
      )
      
      // Content Safety: Moderate AI-generated summary
      const { moderateAIOutput, getSafeErrorMessage } = await import("@/lib/safety/moderation")
      const summaryModeration = moderateAIOutput(summary)
      if (!summaryModeration.allowed) {
        console.warn(`[Safety] Blocked AI-generated summary: ${summaryModeration.reason}`, {
          userId: session.user.id,
          contentId,
          severity: summaryModeration.severity,
        })
        return NextResponse.json(
          { 
            error: "Unable to generate summary due to content safety guidelines. Please ensure your content is educational and appropriate.",
            code: 'OUTPUT_MODERATION',
          },
          { status: 500 }
        )
      }
      summary = summaryModeration.sanitized || summary
      
      console.log(`[PROCESS] Summary generated successfully, length: ${summary?.length || 0}`)
    } catch (summaryError: any) {
      console.error(`[PROCESS] Summary generation failed for ${contentId}:`, summaryError?.message || summaryError)
      // Return error but don't fail completely
      return NextResponse.json(
        { 
          error: `Failed to generate summary: ${summaryError.message || "Unknown error"}`,
          details: "Check your AI API key and provider configuration"
        },
        { status: 500 }
      )
    }

    // Get or create processed content
    let processedContent = await getProcessedContentByContentId(contentId)
    
    if (!processedContent) {
      // Create processed content if it doesn't exist
      processedContent = await createProcessedContent({
        content_id: contentId,
        chunks: [],
      })
    }

    if (processedContent) {
      // Generate embeddings for chunks if they exist
      let embeddings = null
      if (Array.isArray(processedContent.chunks) && processedContent.chunks.length > 0) {
        try {
          const chunkTexts = (processedContent.chunks as any[]).map((chunk) => chunk.text)
          embeddings = await generateEmbeddings(chunkTexts)
        } catch (embedError) {
          console.error("Error generating embeddings:", embedError)
          // Continue without embeddings - they're optional
        }
      }

      // Update processed content with summary (plain markdown text)
      const updateData: any = {
        summary: typeof summary === "string" ? summary : JSON.stringify(summary),
      }
      if (embeddings) {
        updateData.embeddings = embeddings
      }

      const updated = await updateProcessedContent(processedContent.id, updateData)
      if (!updated) {
        console.error(`[PROCESS] Failed to save summary for content: ${contentId}`)
        return NextResponse.json(
          { error: "Failed to save summary" },
          { status: 500 }
        )
      }
      console.log(`[PROCESS] Summary saved to database for content: ${contentId}`)
    } else {
      console.error("Failed to create or retrieve processed content")
      return NextResponse.json(
        { error: "Failed to create processed content record" },
        { status: 500 }
      )
    }

    // Update content status
    await updateContent(contentId, { status: "complete" })
    console.log(`[PROCESS] Content status updated to complete: ${contentId}`)

    return NextResponse.json({
      success: true,
      summary,
      message: "Content processed successfully",
    })
  } catch (error: any) {
    console.error("Processing error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to process content" },
      { status: 500 }
    )
  }
}

