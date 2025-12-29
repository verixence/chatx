import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth/middleware"
import { supabaseAdmin } from "@/lib/db/supabase"
import { initializeBucket } from "@/lib/storage/supabase"

/**
 * Server-side file upload endpoint
 * Handles PDF uploads to Supabase Storage with proper authentication
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const workspaceId = formData.get("workspaceId") as string | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace ID required" }, { status: 400 })
    }

    // Ensure bucket exists
    try {
      await initializeBucket()
    } catch (bucketError: any) {
      console.error("Bucket initialization error:", bucketError)
      // Continue anyway - bucket might already exist
    }

    const path = `pdfs/${workspaceId}/${Date.now()}-${file.name}`
    console.log(`[UPLOAD] Server-side upload: ${path}, size: ${file.size} bytes`)

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload using service role (bypasses RLS, but we've authenticated via NextAuth)
    const { data, error: uploadError } = await supabaseAdmin.storage
      .from("learnchat-files")
      .upload(path, buffer, {
        contentType: "application/pdf",
        upsert: true,
      })

    if (uploadError) {
      console.error("PDF upload error:", uploadError)
      return NextResponse.json(
        {
          error: "Failed to upload PDF to storage",
          details: uploadError.message || "Unknown error",
        },
        { status: 500 }
      )
    }

    if (!data?.path) {
      console.error("Upload succeeded but no path returned")
      return NextResponse.json(
        { error: "Upload succeeded but failed to get file path" },
        { status: 500 }
      )
    }

    console.log(`[UPLOAD] PDF uploaded successfully: ${data.path}`)

    return NextResponse.json({
      success: true,
      path: data.path,
      message: "File uploaded successfully",
    })
  } catch (error: any) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to upload file" },
      { status: 500 }
    )
  }
}

