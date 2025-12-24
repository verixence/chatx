import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { redirect } from "next/navigation"
import { getUserById } from "@/lib/db/queries"
import SettingsInterface from "@/components/settings/SettingsInterface"

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { success?: string; canceled?: string; session_id?: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect("/login")
  }

  const user = await getUserById(session.user.id)

  return <SettingsInterface user={user} searchParams={searchParams} />
}

