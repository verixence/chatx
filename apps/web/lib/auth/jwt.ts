/**
 * JWT utilities for mobile app authentication
 */
import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'dev-secret'
)

export interface CustomJWTPayload {
  userId: string
  email: string
  iat?: number
  exp?: number
}

/**
 * Generate a JWT token for a user
 */
export async function generateToken(userId: string, email: string): Promise<string> {
  const token = await new SignJWT({ userId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d') // 30 days
    .sign(JWT_SECRET)

  return token
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<CustomJWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as CustomJWTPayload
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}
