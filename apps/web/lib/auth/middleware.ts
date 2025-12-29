/**
 * Authentication middleware for API routes
 * Supports both NextAuth sessions (web) and JWT tokens (mobile)
 */
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './config'
import { verifyToken } from './jwt'
import { getUserById } from '@/lib/db/queries'

export interface AuthenticatedRequest {
  userId: string
  userEmail: string
}

/**
 * Authenticate request from either NextAuth session or JWT token
 * Returns user info if authenticated, throws error if not
 */
export async function authenticateRequest(req: NextRequest): Promise<AuthenticatedRequest> {
  // First, try JWT token (for mobile apps)
  const authHeader = req.headers.get('authorization')

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    const payload = await verifyToken(token)

    if (payload?.userId && payload?.email) {
      return {
        userId: payload.userId,
        userEmail: payload.email,
      }
    }
  }

  // Fall back to NextAuth session (for web app)
  const session = await getServerSession(authOptions)

  if (session?.user?.id && session?.user?.email) {
    return {
      userId: session.user.id,
      userEmail: session.user.email,
    }
  }

  // Not authenticated
  throw new Error('Unauthorized')
}

/**
 * Get authenticated user from request
 * Returns full user object from database
 */
export async function getAuthenticatedUser(req: NextRequest) {
  const auth = await authenticateRequest(req)
  const user = await getUserById(auth.userId)

  if (!user) {
    throw new Error('User not found')
  }

  return user
}
