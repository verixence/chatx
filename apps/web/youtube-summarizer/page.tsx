import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { createWorkspace, createContent, createProcessedContent, updateContent } from "@/lib/db/queries"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Youtube } from "lucide-react"
import ContentUpload from "@/components/workspace/ContentUpload"

export default async function PublicYouTubeSummarizerPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    // For now, require login to reuse existing ingestion safely
    redirect("/login")
  }

  // Reuse workspace/new flow: send user to create/upload content there
  redirect("/workspace/new")
}


