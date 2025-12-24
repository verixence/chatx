import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { getUserById } from "@/lib/db/queries"
import { sendTrialEndingSoonEmail } from "@/lib/email/notifications"

/**
 * Send trial ending soon notification
 * POST /api/subscription/notify-trial-ending
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserById(session.user.id)
    if (!user || !user.email) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get trial days remaining
    const { getTrialDaysRemaining, isTrialActive } = await import('@/lib/subscriptions/subscription')
    
    if (!isTrialActive(user.subscription_status, user.subscription_end_date)) {
      return NextResponse.json({ error: "User is not in active trial" }, { status: 400 })
    }

    const daysRemaining = getTrialDaysRemaining(user.subscription_end_date)
    
    if (daysRemaining !== null && daysRemaining <= 3) {
      await sendTrialEndingSoonEmail(user.email, daysRemaining)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Trial ending notification error:", error)
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    )
  }
}

