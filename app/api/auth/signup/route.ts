import { NextResponse } from "next/server"
import { getUserByEmail, createUser, hashPassword } from "@/lib/db/queries"

export async function POST(req: Request) {
  try {
    // Check environment variables first
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing Supabase environment variables")
      return NextResponse.json(
        { error: "Server configuration error. Please contact support." },
        { status: 500 }
      )
    }

    const { name, email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    // Check if user exists
    let existingUser
    try {
      existingUser = await getUserByEmail(email)
    } catch (err: any) {
      console.error("Error checking existing user:", err)
      return NextResponse.json(
        { error: "Database error. Please try again." },
        { status: 500 }
      )
    }

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const password_hash = await hashPassword(password)

    // Create user
    const user = await createUser({
      email,
      name,
      password_hash,
      subscription: "free",
    })

    if (!user) {
      console.error("createUser returned null - check server logs for details")
      // Return a more helpful error message
      return NextResponse.json(
        { 
          error: "Failed to create user. Please check your database connection and ensure the migration has been run.",
          details: "Check server console for detailed error logs"
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, userId: user.id })
  } catch (error: any) {
    console.error("Signup error:", error)
    console.error("Error details:", error?.message)
    console.error("Error stack:", error?.stack)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    )
  }
}

