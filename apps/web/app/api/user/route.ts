import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth/middleware"
import { getUserById, deleteUser } from "@/lib/db/queries"

// Get user data
export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserById(auth.userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error: any) {
    console.error("Get user error:", error)
    return NextResponse.json(
      { error: "Failed to get user data" },
      { status: 500 }
    )
  }
}

// Delete user account
export async function DELETE(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete the user and all associated data
    await deleteUser(auth.userId)

    return NextResponse.json({ success: true, message: "Account deleted successfully" })
  } catch (error: any) {
    console.error("Delete user error:", error)
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    )
  }
}
