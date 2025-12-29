import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/lib/auth/middleware"

/**
 * GET /api/user/me
 * Returns the currently authenticated user (works with both JWT and session)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      subscription: user.subscription,
      subscription_status: user.subscription_status,
      subscription_end_date: user.subscription_end_date,
      content_count: user.content_count,
    })
  } catch (error: any) {
    console.error("Get current user error:", error)
    if (error.message === 'Unauthorized' || error.message === 'User not found') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Failed to get user" },
      { status: 500 }
    )
  }
}
