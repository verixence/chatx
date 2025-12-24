import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { redirect, notFound } from "next/navigation"
import { getWorkspaceById, getQuizzesByWorkspaceId } from "@/lib/db/queries"
import QuizInterface from "@/components/quiz/QuizInterface"

export default async function QuizPage({
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

  const quizzes = await getQuizzesByWorkspaceId(params.id)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Quizzes - {workspace.name}</h1>
        <p className="text-muted-foreground mt-2">
          Test your knowledge with AI-generated quizzes
        </p>
      </div>
      <QuizInterface workspaceId={params.id} existingQuizzes={quizzes.slice(0, 5)} />
    </div>
  )
}

