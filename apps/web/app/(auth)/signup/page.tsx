"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const plan = searchParams?.get("plan") || null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to create account")
        return
      }

      // If plan is specified, redirect to Stripe checkout after login
      if (plan && (plan === 'pro' || plan === 'enterprise')) {
        router.push(`/login?registered=true&plan=${plan}`)
      } else {
        router.push("/login?registered=true")
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

      <Card className="w-full max-w-md shadow-2xl border border-black/10 bg-white/95 backdrop-blur-md relative z-10">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
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
          <CardTitle className="text-2xl font-bold text-black">Create an account</CardTitle>
          <CardDescription className="text-black/70">
            Get started with your AI-powered learning journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-black">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-white border-black/10 text-black placeholder:text-black/40 focus:border-[#EFA07F] focus:ring-2 focus:ring-[#EFA07F]/20 rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-black">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white border-black/10 text-black placeholder:text-black/40 focus:border-[#EFA07F] focus:ring-2 focus:ring-[#EFA07F]/20 rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-black">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="bg-white border-black/10 text-black placeholder:text-black/40 focus:border-[#EFA07F] focus:ring-2 focus:ring-[#EFA07F]/20 rounded-lg pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-black/70 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full bg-[#EFA07F] hover:bg-[#EFA07F]/90 text-black font-medium shadow-lg hover:shadow-xl transition-all duration-200 rounded-full" disabled={loading}>
              {loading ? "Creating account..." : "Sign up"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-black/70">
            Already have an account?{" "}
            <Link href="/login" className="text-[#EFA07F] hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

