import { getLLMProvider, getDefaultProvider, getProviderApiKey, type AIProvider } from "./providers"
import { PromptTemplate } from "@langchain/core/prompts"
import { RunnableSequence } from "@langchain/core/runnables"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { getEducationalPromptSuffix } from "@/lib/safety/moderation"

export async function createSummarizationChain(
  content: string,
  provider?: AIProvider,
  userId?: string
) {
  const aiProvider = provider || getDefaultProvider()
  const llm = getLLMProvider({
    provider: aiProvider,
    model: aiProvider === "groq" ? "llama-3.1-8b-instant" : "gpt-4o",
    temperature: 0.7,
    apiKey: getProviderApiKey(aiProvider),
  })

  const prompt = PromptTemplate.fromTemplate(`
You are an expert educational tutor. Summarize the following learning content for a student.

Content:
{content}

Write your answer as plain, student-friendly markdown using EXACTLY these sections and headings:

## Overview
- 2–3 sentences summarizing the main idea of the whole lesson.

## Key Takeaways
- Bullet list of the most important points a student should remember.

## Important Concepts
- Bullet list of key terms or concepts (one per bullet) that can be turned into flashcards.

## Questions to Think About
- 3–5 thoughtful questions a student could answer after studying this content.

If the content comes from a video and you can infer timing, append timestamps in square brackets like [03:15] or [1:02:45] right after the relevant sentence or bullet whenever helpful.

Important formatting rules:
- Use normal markdown only (headings, bullets, text).
- Do NOT wrap the answer in any code block.
- Do NOT return JSON.
- Keep content age-appropriate for students (10-17 years old).
- Focus only on educational content from the materials provided.

${getEducationalPromptSuffix()}

Just return the markdown sections above so the app can show them directly to the student.
`)

  const chain = RunnableSequence.from([
    prompt,
    llm,
    new StringOutputParser(),
  ])

  const result = await chain.invoke({ content })

  // We now return the markdown string directly.
  // The UI will render this as plain text / markdown-style sections.
  return result
}

export async function createQuizGenerationChain(
  content: string,
  difficulty: "easy" | "medium" | "hard" = "medium",
  numQuestions: number = 5,
  provider?: AIProvider
) {
  const aiProvider = provider || getDefaultProvider()
  const llm = getLLMProvider({
    provider: aiProvider,
    model: aiProvider === "groq" ? "llama-3.1-8b-instant" : "gpt-4o",
    temperature: 0.8,
    apiKey: getProviderApiKey(aiProvider),
  })

  // Build the prompt string manually to avoid f-string / template parsing issues
  const promptText = `
You are an expert assessment designer. Generate ${numQuestions} ${difficulty} quiz questions
based ONLY on the content below.

Content:
${content}

For each question, include these fields:
- "question": the question text (age-appropriate for students 10-17)
- "type": either "multiple_choice" or "short_answer"
- "options": an array of options (for multiple_choice; use [] for short_answer)
- "correctAnswer": the correct answer as a string
- "explanation": a brief explanation of the answer

CRITICAL FORMATTING RULES:
- Return ONLY a valid JSON array of question objects.
- Do NOT wrap the JSON in backticks or a code block.
- Do NOT include any text before or after the JSON.
- Do NOT include comments or trailing commas.
- Focus only on educational content from the materials provided.

${getEducationalPromptSuffix()}
`.trim()

  const chain = RunnableSequence.from([
    async () => promptText,
    llm,
    new StringOutputParser(),
  ])

  const result = await chain.invoke({})

  // Be defensive: the model might still add extra text. Try to extract the first JSON array.
  try {
    return JSON.parse(result)
  } catch {
    try {
      const start = result.indexOf("[")
      const end = result.lastIndexOf("]")
      if (start !== -1 && end !== -1 && end > start) {
        const candidate = result.slice(start, end + 1)
        return JSON.parse(candidate)
      }
    } catch {
      // fall through
    }
    console.error("Failed to parse quiz generation JSON. Raw result:", result)
    return []
  }
}

export async function createFlashcardGenerationChain(
  content: string,
  numCards: number = 10,
  provider?: AIProvider
) {
  const aiProvider = provider || getDefaultProvider()
  const llm = getLLMProvider({
    provider: aiProvider,
    model: aiProvider === "groq" ? "llama-3.1-8b-instant" : "gpt-4o",
    temperature: 0.7,
    apiKey: getProviderApiKey(aiProvider),
  })

  const prompt = PromptTemplate.fromTemplate(`
You are an expert tutor. Generate {numCards} high-quality flashcards based ONLY on
the content below.

Content:
{content}

Each flashcard object MUST have:
- "question": a clear, concise question (age-appropriate for students 10-17)
- "answer": a detailed but concise answer

CRITICAL FORMATTING RULES:
- Return ONLY a valid JSON array of flashcard objects.
- Do NOT wrap the JSON in backticks or a code block.
- Do NOT include any text before or after the JSON.
- Do NOT include comments or trailing commas.
- Focus only on educational content from the materials provided.

${getEducationalPromptSuffix()}
`)

  const chain = RunnableSequence.from([
    prompt,
    llm,
    new StringOutputParser(),
  ])

  const result = await chain.invoke({
    content,
    numCards: numCards.toString(),
  })

  // Defensive parsing: try to extract the first JSON array if needed
  try {
    return JSON.parse(result)
  } catch {
    try {
      const start = result.indexOf("[")
      const end = result.lastIndexOf("]")
      if (start !== -1 && end !== -1 && end > start) {
        const candidate = result.slice(start, end + 1)
        return JSON.parse(candidate)
      }
    } catch {
      // fall through
    }
    console.error("Failed to parse flashcard generation JSON. Raw result:", result)
    return []
  }
}

