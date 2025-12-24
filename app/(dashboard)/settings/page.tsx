import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { redirect } from "next/navigation"
import { getUserById } from "@/lib/db/queries"
import SettingsInterface from "@/components/settings/SettingsInterface"

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string; session_id?: string; upgrade?: string }> | { success?: string; canceled?: string; session_id?: string; upgrade?: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect("/login")
  }

  // Handle both Promise (Next.js 15+) and direct object (Next.js 13/14)
  const resolvedSearchParams = searchParams instanceof Promise 
    ? await searchParams 
    : searchParams

  const user = await getUserById(session.user.id)

  return <SettingsInterface user={user} searchParams={resolvedSearchParams} />
}

