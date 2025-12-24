import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { getContentById, getProcessedContentByContentId } from "@/lib/db/queries"

// Disable caching for this endpoint - always return fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  req: NextRequest,
  { params }: { params: { contentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const content = await getContentById(params.contentId)
    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 })
    }

    const processed = await getProcessedContentByContentId(params.contentId)
    
    // Log what we're returning for debugging
    const hasSummary = processed?.summary && 
      typeof processed.summary === 'string' && 
      processed.summary.trim().length > 0
    
    console.log(`[PROCESSED API] Content ${params.contentId}: status=${content.status}, hasSummary=${hasSummary}, summaryLength=${processed?.summary?.length || 0}`)
    
    if (hasSummary) {
      console.log(`[PROCESSED API] Summary returned to client for content ${params.contentId}`)
    }

    return NextResponse.json({
      processed,
      content: {
        id: content.id,
        status: content.status,
        title: content.title,
        metadata: content.metadata,
        type: content.type,
      },
    })
  } catch (error: any) {
    console.error("Error fetching processed content:", error)
    return NextResponse.json(
      { error: "Failed to fetch processed content" },
      { status: 500 }
    )
  }
}

