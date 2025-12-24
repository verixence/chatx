import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { updateUser } from "@/lib/db/queries"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { aiProvider } = await req.json()

    if (!aiProvider || !["groq", "openai"].includes(aiProvider)) {
      return NextResponse.json(
        { error: "Invalid AI provider" },
        { status: 400 }
      )
    }

    await updateUser(session.user.id, { ai_provider: aiProvider as any })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Settings update error:", error)
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    )
  }
}

