import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth/middleware"
import { getContentById, updateContent } from "@/lib/db/queries"
import { getSignedUrl } from "@/lib/storage/supabase"
import { supabaseAdmin } from "@/lib/db/supabase"

/**
 * GET /api/content/[contentId]/pdf-url
 * Returns a publicly accessible PDF URL for the given content
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ contentId: string }> | { contentId: string } }
) {
  try {
    const auth = await authenticateRequest(req)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Handle both Promise and direct params (Next.js 13+ compatibility)
    const resolvedParams = await Promise.resolve(params)
    const contentId = resolvedParams.contentId

    if (!contentId) {
      return NextResponse.json({ error: "Content ID is required" }, { status: 400 })
    }

    console.log(`[PDF-URL] Fetching PDF URL for content: ${contentId}`)

    // Fetch content from database
    const content = await getContentById(contentId)
    
    if (!content) {
      console.error(`[PDF-URL] Content not found: ${contentId}`)
      return NextResponse.json({ error: "Content not found" }, { status: 404 })
    }

    // Verify content type
    if (content.type !== "pdf") {
      console.error(`[PDF-URL] Content is not a PDF: ${content.type}`)
      return NextResponse.json(
        { error: "Content is not a PDF", contentType: content.type },
        { status: 400 }
      )
    }

    // Extract storage path from metadata
    const metadata = content.metadata && typeof content.metadata === "object"
      ? (content.metadata as any)
      : null

    let storagePath = metadata?.storagePath || null

    if (!storagePath) {
      console.warn(`[PDF-URL] Storage path not found for content ${contentId}, attempting to find file in storage`)
      
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
              matchingFile = pdfFiles.sort((a, b) => {
                const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 0
                const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 0
                return bTime - aTime
              })[0]
            }
            
            if (matchingFile) {
              storagePath = `${workspaceFolder}/${matchingFile.name}`
              console.log(`[PDF-URL] Found file in storage: ${storagePath}`)
              
              // Update metadata
              try {
                const { updateContent } = await import("@/lib/db/queries")
                await updateContent(contentId, {
                  metadata: {
                    ...metadata,
                    storagePath: storagePath,
                  }
                })
                console.log(`[PDF-URL] Updated metadata with storagePath for content ${contentId}`)
              } catch (updateError) {
                console.warn(`[PDF-URL] Failed to update metadata:`, updateError)
              }
            }
          }
        }
      } catch (searchError: any) {
        console.warn(`[PDF-URL] Error searching for file:`, searchError?.message)
      }
      
      if (!storagePath) {
        console.error(`[PDF-URL] Storage path not found in metadata for content: ${contentId}`)
        return NextResponse.json(
          {
            error: "PDF file not found in storage",
            message: "The content record exists but the PDF file is missing from storage. Please re-upload the PDF.",
            contentId,
          },
          { status: 400 }
        )
      }
    }

    console.log(`[PDF-URL] Storage path found: ${storagePath}`)

    // Verify file exists in storage before generating URL
    try {
      const { supabaseAdmin } = await import("@/lib/db/supabase")
      const { data: fileData, error: checkError } = await supabaseAdmin.storage
        .from("learnchat-files")
        .list(storagePath.split("/").slice(0, -1).join("/") || "", {
          limit: 1,
          search: storagePath.split("/").pop() || "",
        })

      if (checkError) {
        console.warn(`[PDF-URL] Could not verify file existence:`, checkError)
        // Continue anyway - file might still exist
      }
    } catch (verifyError) {
      console.warn(`[PDF-URL] File verification skipped:`, verifyError)
      // Continue anyway
    }

    // Generate signed URL (valid for 1 hour)
    let pdfUrl: string
    try {
      pdfUrl = await getSignedUrl(storagePath, 3600)
      console.log(`[PDF-URL] Generated signed URL successfully`)
    } catch (urlError: any) {
      console.error(`[PDF-URL] Error generating signed URL:`, urlError)
      
      // Check if it's a "not found" error
      if (urlError.message?.includes("not found") || urlError.message?.includes("does not exist")) {
        return NextResponse.json(
          {
            error: "PDF file not found in storage",
            message: "The PDF file was not found at the expected location. Please re-upload the PDF.",
            storagePath,
          },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        {
          error: "Failed to generate PDF URL",
          message: urlError.message || "Storage service error",
          storagePath,
        },
        { status: 500 }
      )
    }

    // Extract title and page count from metadata
    const title = metadata?.display_title || 
                  metadata?.title || 
                  metadata?.info?.Title || 
                  "PDF Document"
    
    const pageCount = metadata?.pages || 
                      metadata?.info?.Pages || 
                      null

    // Return response in the required format
    return NextResponse.json({
      pdfUrl,
      title,
      ...(pageCount && { pageCount: Number(pageCount) }),
    })
  } catch (error: any) {
    console.error("[PDF-URL] Unexpected error:", error)
    console.error("[PDF-URL] Error stack:", error.stack)
    return NextResponse.json(
      {
        error: "Failed to generate PDF URL",
        message: error.message || "Internal server error",
      },
      { status: 500 }
    )
  }
}

