import { NextResponse } from "next/server"
import { getUserWithPasswordByEmail, verifyPassword } from "@/lib/db/queries"
import { generateToken } from "@/lib/auth/jwt"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    // Get user with password hash
    const user = await getUserWithPasswordByEmail(email)

    if (!user || !user.password_hash) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    // Generate JWT token
    const token = await generateToken(user.id, user.email)

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscription: user.subscription,
        subscription_status: user.subscription_status,
        subscription_end_date: user.subscription_end_date,
        content_count: user.content_count,
      }
    })
  } catch (error: any) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    )
  }
}
