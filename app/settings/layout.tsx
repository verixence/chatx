import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { redirect } from "next/navigation"
import DashboardNav from "@/components/layout/DashboardNav"
import Image from "next/image"

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen relative bg-white">
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
      <div className="relative z-10">
        <DashboardNav />
        <main className="container mx-auto px-0 pt-14 sm:pt-16 overflow-x-hidden">{children}</main>
      </div>
    </div>
  )
}

