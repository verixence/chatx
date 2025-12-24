import { getContentsByWorkspaceId, getProcessedContentByContentId, updateProcessedContent, getWorkspacesByUserId } from "@/lib/db/queries"

async function run() {
  const userId = process.env.MIGRATION_USER_ID
  if (!userId) {
    console.error("Set MIGRATION_USER_ID to run this script.")
    return
  }

  const workspaces = await getWorkspacesByUserId(userId)

  for (const ws of workspaces) {
    const contents = await getContentsByWorkspaceId(ws.id)
    for (const content of contents) {
      const processed = await getProcessedContentByContentId(content.id)
      if (!processed || !processed.summary) continue

      if (typeof processed.summary === "string") {
        try {
          const trimmed = processed.summary.trim()
          if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
            const obj = JSON.parse(trimmed)
            const overview = obj.overview || ""
            const keyTakeaways: string[] = obj.keyTakeaways || obj.keyPoints || []
            const concepts: string[] = obj.concepts || []
            const questions: string[] = obj.questions || obj.questionsToThinkAbout || []

            const lines: string[] = []
            lines.push("## Overview", "", overview || "No overview available.", "", "## Key Takeaways", "")
            if (keyTakeaways.length) {
              keyTakeaways.forEach((p: string) => lines.push(`- ${p}`))
            }
            lines.push("", "## Important Concepts", "")
            if (concepts.length) {
              concepts.forEach((c: string) => lines.push(`- ${c}`))
            }
            lines.push("", "## Questions to Think About", "")
            if (questions.length) {
              questions.forEach((q: string) => lines.push(`- ${q}`))
            }

            await updateProcessedContent(processed.id, { summary: lines.join("\n") })
          }
        } catch {
          // ignore and leave as-is
        }
      }
    }
  }

  console.log("Summary migration finished")
}

run().catch((err) => {
  console.error(err)
})


