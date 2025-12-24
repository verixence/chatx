import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { redirect, notFound } from "next/navigation"
import { getWorkspaceById, getFlashcardsByWorkspaceId } from "@/lib/db/queries"
import FlashcardsInterface from "@/components/flashcards/FlashcardsInterface"

export default async function FlashcardsPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect("/login")
  }

  const workspace = await getWorkspaceById(params.id)

  if (!workspace) {
    notFound()
  }

  if (workspace.user_id !== session.user.id && !workspace.shared) {
    redirect("/dashboard")
  }

  const flashcards = await getFlashcardsByWorkspaceId(params.id)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Flashcards - {workspace.name}</h1>
        <p className="text-muted-foreground mt-2">
          Study with spaced repetition
        </p>
      </div>
      <FlashcardsInterface
        workspaceId={params.id}
        existingFlashcards={flashcards}
      />
    </div>
  )
}

