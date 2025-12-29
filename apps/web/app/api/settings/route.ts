import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth/middleware"
import { updateUser } from "@/lib/db/queries"

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { aiProvider } = await req.json()

    if (!aiProvider || !["groq", "openai"].includes(aiProvider)) {
      return NextResponse.json(
        { error: "Invalid AI provider" },
        { status: 400 }
      )
    }

    await updateUser(auth.userId, { ai_provider: aiProvider as any })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Settings update error:", error)
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    )
  }
}

