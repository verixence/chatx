import { NextAuthOptions } from "next-auth"
import { randomBytes } from "crypto"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { getUserByEmail, createUser, getUserWithPasswordByEmail, verifyPassword } from "@/lib/db/queries"

// Build providers dynamically so we don't break in environments
// where Google OAuth credentials are not configured.
const providers: NextAuthOptions["providers"] = []

const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET

if (googleClientId && googleClientSecret) {
  providers.push(
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    })
  )
}

providers.push(
  CredentialsProvider({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        return null
      }

      // Get user with password hash for verification
      const user = await getUserWithPasswordByEmail(credentials.email)

      if (!user) {
        return null
      }

      // If user has no password hash, they can't use password login
      // (they might have signed up via OAuth)
      if (!user.password_hash) {
        return null
      }

      // Verify password
      const isValidPassword = await verifyPassword(credentials.password, user.password_hash)

      if (!isValidPassword) {
        return null
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
      }
    },
  })
)

// Ensure we always have a secret so NextAuth doesn't throw in production.
// Best practice is to set NEXTAUTH_SECRET in your environment (Vercel).
// This fallback just prevents hard 500s if it's accidentally missing.
const nextAuthSecret =
  process.env.NEXTAUTH_SECRET ||
  process.env.AUTH_SECRET ||
  (process.env.NODE_ENV === "production"
    ? randomBytes(32).toString("hex")
    : "dev-secret")

export const authOptions: NextAuthOptions = {
  providers,
  // NextAuth requires a secret in production to sign/encrypt JWTs.
  // It must be set as NEXTAUTH_SECRET in your environment (see README / deployment docs).
  secret: nextAuthSecret,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    signOut: "/",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle OAuth sign-in (Google)
      if (account?.provider === "google" && user.email) {
        let dbUser = await getUserByEmail(user.email)
        
        if (!dbUser) {
          // Create user if doesn't exist
          dbUser = await createUser({
            email: user.email,
            name: user.name || profile?.name || undefined,
            image: user.image || (profile as any)?.picture || undefined,
          })
        }
        
        if (dbUser) {
          user.id = dbUser.id
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
}

