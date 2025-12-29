import { NextResponse } from "next/server"
import { getUserByEmail, createUser, hashPassword } from "@/lib/db/queries"
import { generateToken } from "@/lib/auth/jwt"

// Add CORS headers for mobile app
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS(req: Request) {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(req: Request) {
  try {
    // Check environment variables first
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing Supabase environment variables")
      return NextResponse.json(
        { error: "Server configuration error. Please contact us at info@verixence.com" },
        { status: 500, headers: corsHeaders }
      )
    }

    const { name, email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400, headers: corsHeaders }
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
        { status: 500, headers: corsHeaders }
      )
    }

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400, headers: corsHeaders }
      )
    }

    // Hash password
    const password_hash = await hashPassword(password)

    // Create user
    const user = await createUser({
      email,
      name,
      password_hash,
      subscription: "freemium",
    })

    if (!user) {
      console.error("createUser returned null - check server logs for details")
      // Return a more helpful error message
      return NextResponse.json(
        {
          error: "Failed to create user. Please check your database connection and ensure the migration has been run.",
          details: "Check server console for detailed error logs"
        },
        { status: 500, headers: corsHeaders }
      )
    }

    // Generate JWT token for mobile app
    const token = await generateToken(user.id, user.email)

    return NextResponse.json({
      success: true,
      userId: user.id,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscription: user.subscription,
        subscription_status: user.subscription_status,
      }
    }, { headers: corsHeaders })
  } catch (error: any) {
    console.error("Signup error:", error)
    console.error("Error details:", error?.message)
    console.error("Error stack:", error?.stack)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500, headers: corsHeaders }
    )
  }
}

