"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogOut, Settings } from "lucide-react"
import { useState } from "react"

export default function DashboardNav() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const navItems: Array<{ href: string; label: string; icon: any }> = [
    {
      href: "/settings",
      label: "Settings",
      icon: Settings,
    },
  ]

  const [showMobileMenu, setShowMobileMenu] = useState(false)

  return (
    <>
      <nav className="border-b border-black/10 bg-white/90 backdrop-blur-md shadow-sm fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center space-x-4 sm:space-x-8 min-w-0 flex-1">
              <Link href="/dashboard" className="flex items-center space-x-2 flex-shrink-0">
                <Image 
                  src="/logo.png" 
                  alt="ChatX Logo" 
                  width={32} 
                  height={32} 
                  className="h-6 w-6 sm:h-8 sm:w-8 object-contain"
                />
                <span className="text-lg sm:text-xl font-bold text-black">ChatX</span>
                <span className="text-xs text-black/70 font-normal">by Verixence</span>
              </Link>
              <div className="hidden md:flex items-center space-x-1">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-[#F9E5DD] text-black"
                          : "text-black/70 hover:text-black hover:bg-black/5"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <div className="hidden sm:flex items-center space-x-2">
                <span className="text-xs sm:text-sm text-black/70 truncate max-w-[120px] lg:max-w-none">
                  {session?.user?.email}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="p-2 hover:bg-black/5 text-black/70 hover:text-black rounded-full"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="sm:hidden p-2 hover:bg-black/5 text-black/70 hover:text-black rounded-full"
              >
                <LogOut className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 text-black/70 hover:bg-black/5 rounded-full"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {showMobileMenu ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </Button>
            </div>
          </div>
          {/* Mobile menu */}
          {showMobileMenu && (
            <div className="md:hidden border-t border-black/10 py-2 bg-white/95 backdrop-blur-md">
              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setShowMobileMenu(false)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-[#F9E5DD] text-black"
                          : "text-black/70 hover:text-black hover:bg-black/5"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  )
}

