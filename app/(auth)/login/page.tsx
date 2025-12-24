"use client"

import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const plan = searchParams?.get("plan")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email or password")
      } else {
        // If plan is specified, redirect to checkout
        if (plan && (plan === 'pro' || plan === 'enterprise')) {
          router.push(`/settings?upgrade=${plan}`)
        } else {
          router.push("/dashboard")
        }
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
      {/* Background Image */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/background.jpeg"
          alt="Background"
          fill
          className="object-cover"
          priority
          quality={90}
        />
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md shadow-2xl border border-black/10 bg-white/95 backdrop-blur-md relative z-10">
        <CardHeader className="space-y-3 pb-6">
          <div className="flex items-center justify-center mb-2">
            <div className="p-3 bg-[#F9E5DD] rounded-full">
              <Image 
                src="/logo.png" 
                alt="ChatX Logo" 
                width={32} 
                height={32} 
                className="h-8 w-8"
              />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-black text-center">Welcome back</CardTitle>
          <CardDescription className="text-center text-black/70">
            Sign in to your account to continue learning
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-black font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 bg-white border-black/10 text-black placeholder:text-black/40 focus:border-[#EFA07F] focus:ring-2 focus:ring-[#EFA07F]/20 transition-all rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-black font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 bg-white border-black/10 text-black placeholder:text-black/40 focus:border-[#EFA07F] focus:ring-2 focus:ring-[#EFA07F]/20 transition-all rounded-lg"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-11 bg-[#EFA07F] hover:bg-[#EFA07F]/90 text-black font-medium shadow-lg hover:shadow-xl transition-all duration-200 rounded-full" 
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-black/70">
            Don't have an account?{" "}
            <Link href="/signup" className="text-[#EFA07F] hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>

    </div>
  )
}

