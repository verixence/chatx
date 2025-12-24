import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { getContentById } from "@/lib/db/queries"
import { getSignedUrl } from "@/lib/storage/supabase"
import { supabaseAdmin } from "@/lib/db/supabase"

/**
 * GET /api/content/[contentId]/pdf-thumbnail
 * Returns a signed PDF URL for client-side thumbnail rendering
 * Client will use PDF.js CDN to render the first page as a thumbnail
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ contentId: string }> | { contentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    const contentId = resolvedParams.contentId

    if (!contentId) {
      return NextResponse.json({ error: "Content ID is required" }, { status: 400 })
    }

    // Fetch content from database
    const content = await getContentById(contentId)
    
    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 })
    }

    if (content.type !== "pdf") {
      return NextResponse.json({ error: "Content is not a PDF" }, { status: 400 })
    }

    // Extract storage path from metadata
    const metadata = content.metadata && typeof content.metadata === "object"
      ? (content.metadata as any)
      : null

    let storagePath = metadata?.storagePath || null

    if (!storagePath) {
      console.warn(`[PDF-Thumbnail] Storage path not found for content ${contentId}, attempting to find file in storage`)
      
      // Try to find the PDF file in storage by searching the workspace folder
      try {
        const workspaceFolder = `pdfs/${content.workspace_id}`
        const { data: files, error: listError } = await supabaseAdmin.storage
          .from("learnchat-files")
          .list(workspaceFolder, {
            limit: 1000,
            sortBy: { column: 'created_at', order: 'desc' }
          })
        
        if (!listError && files && files.length > 0) {
          // Filter PDF files
          const pdfFiles = files.filter(file => file.name.toLowerCase().endsWith('.pdf'))
          
          if (pdfFiles.length > 0) {
            // Try to match by filename if we have title info
            let matchingFile = null
            
            if (metadata?.info?.Title) {
              const titlePath = metadata.info.Title
              const fileNameFromTitle = titlePath.split(/[/\\]/).pop()?.replace(/\.pmd$/i, '.pdf') || ''
              
              // Try exact match first
              matchingFile = pdfFiles.find(file => 
                file.name.toLowerCase() === fileNameFromTitle.toLowerCase() ||
                file.name.toLowerCase().includes(fileNameFromTitle.toLowerCase().replace('.pdf', ''))
              )
            }
            
            // If no match, use the most recently modified file
            if (!matchingFile && pdfFiles.length > 0) {
              // Sort by updated_at if available, otherwise use first file
              matchingFile = pdfFiles.sort((a, b) => {
                const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 0
                const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 0
                return bTime - aTime
              })[0]
            }
            
            if (matchingFile) {
              storagePath = `${workspaceFolder}/${matchingFile.name}`
              console.log(`[PDF-Thumbnail] Found file in storage: ${storagePath}`)
              
              // Update metadata to save the storagePath for future use
              try {
                const { updateContent } = await import("@/lib/db/queries")
                await updateContent(contentId, {
                  metadata: {
                    ...metadata,
                    storagePath: storagePath,
                  }
                })
                console.log(`[PDF-Thumbnail] Updated metadata with storagePath for content ${contentId}`)
              } catch (updateError) {
                console.warn(`[PDF-Thumbnail] Failed to update metadata:`, updateError)
                // Continue anyway - we have the path
              }
            }
          }
        }
      } catch (searchError: any) {
        console.warn(`[PDF-Thumbnail] Error searching for file in storage:`, searchError?.message)
      }
      
      // If still no storagePath, try raw_url as fallback
      if (!storagePath && content.raw_url && (content.raw_url.endsWith('.pdf') || content.raw_url.includes('pdf'))) {
        console.log(`[PDF-Thumbnail] Using raw_url as fallback: ${content.raw_url}`)
        return NextResponse.json({ 
          pdfUrl: content.raw_url,
          fallback: true 
        })
      }
      
      // If we still don't have a storagePath, return error
      if (!storagePath) {
        console.error(`[PDF-Thumbnail] Could not find PDF file for content ${contentId}`)
        return NextResponse.json({ 
          error: "PDF file not found in storage",
          message: "Storage path is missing from metadata and file could not be located in storage. The PDF may need to be re-uploaded."
        }, { status: 400 })
      }
    }

    // Generate signed URL for client-side rendering
    const pdfUrl = await getSignedUrl(storagePath, 3600) // 1 hour expiry
    
    return NextResponse.json({ 
      pdfUrl, // Client will use this to render thumbnail with PDF.js
      fallback: true 
    })
  } catch (error: any) {
    console.error("[PDF-Thumbnail] Unexpected error:", error)
    return NextResponse.json(
      { error: "Failed to generate thumbnail URL", message: error.message },
      { status: 500 }
    )
  }
}

