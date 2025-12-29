import { NextResponse } from "next/server"
import { getUserWithPasswordByEmail, verifyPassword } from "@/lib/db/queries"
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
    console.log("[Login API] Received login request")
    const { email, password } = await req.json()
    console.log("[Login API] Email:", email)

    if (!email || !password) {
      console.log("[Login API] Missing email or password")
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400, headers: corsHeaders }
      )
    }

    // Get user with password hash
    console.log("[Login API] Fetching user from database...")
    const user = await getUserWithPasswordByEmail(email)
    console.log("[Login API] User found:", !!user)

    if (!user || !user.password_hash) {
      console.log("[Login API] User not found or no password hash")
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401, headers: corsHeaders }
      )
    }

    // Verify password
    console.log("[Login API] Verifying password...")
    const isValidPassword = await verifyPassword(password, user.password_hash)
    console.log("[Login API] Password valid:", isValidPassword)

    if (!isValidPassword) {
      console.log("[Login API] Invalid password")
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401, headers: corsHeaders }
      )
    }

    // Generate JWT token
    console.log("[Login API] Generating JWT token...")
    const token = await generateToken(user.id, user.email)
    console.log("[Login API] Login successful for user:", user.email)

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
    }, { headers: corsHeaders })
  } catch (error: any) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500, headers: corsHeaders }
    )
  }
}
