import { getLLMProvider, getDefaultProvider, getProviderApiKey, type AIProvider } from "./providers"
import { PromptTemplate } from "@langchain/core/prompts"
import { RunnableSequence } from "@langchain/core/runnables"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { getEducationalPromptSuffix } from "@/lib/safety/moderation"

async function runSummarizationWithProvider(content: string, provider: AIProvider) {
  const llm = getLLMProvider({
    provider,
    model: provider === "groq" ? "llama-3.1-8b-instant" : "gpt-4o",
    temperature: 0.7,
    apiKey: getProviderApiKey(provider),
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

export async function createSummarizationChain(
  content: string,
  provider?: AIProvider,
  userId?: string
) {
  const aiProvider = provider || getDefaultProvider()

  try {
    // Try with specified provider (Groq by default)
    return await runSummarizationWithProvider(content, aiProvider)
  } catch (error: any) {
    // If Groq fails, automatically fallback to OpenAI
    if (aiProvider === "groq") {
      console.warn(`Groq summarization failed, falling back to OpenAI:`, error.message)
      try {
        return await runSummarizationWithProvider(content, "openai")
      } catch (fallbackError: any) {
        console.error("OpenAI fallback also failed:", fallbackError.message)
        throw fallbackError
      }
    }
    throw error
  }
}

async function runQuizGenerationWithProvider(
  content: string,
  difficulty: "easy" | "medium" | "hard",
  numQuestions: number,
  provider: AIProvider
) {
  const llm = getLLMProvider({
    provider,
    model: provider === "groq" ? "llama-3.1-8b-instant" : "gpt-4o",
    temperature: 0.8,
    apiKey: getProviderApiKey(provider),
  })

  // Build the prompt string manually to avoid f-string / template parsing issues
  const promptText = `
You are an expert assessment designer. Generate ${numQuestions} ${difficulty} multiple-choice quiz questions
based ONLY on the content below.

Content:
${content}

For each question, include these fields:
- "question": the question text (age-appropriate for students 10-17)
- "type": must always be "multiple_choice"
- "options": an array of exactly 4 answer options
- "correctAnswer": the correct answer as a string (must match one of the options exactly)
- "explanation": a brief explanation of why the answer is correct

CRITICAL FORMATTING RULES:
- Return ONLY a valid JSON array of question objects.
- Do NOT wrap the JSON in backticks or a code block.
- Do NOT include any text before or after the JSON.
- Do NOT include comments or trailing commas.
- Each question MUST have exactly 4 options.
- The correctAnswer MUST be one of the 4 options (exact match).
- IMPORTANT: Randomize the position of correct answers - DO NOT place all correct answers in position B or any single position. Mix them naturally across positions A, B, C, and D.
- Ensure wrong answers (distractors) are plausible but clearly incorrect.
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
  let questions
  try {
    questions = JSON.parse(result)
  } catch {
    try {
      const start = result.indexOf("[")
      const end = result.lastIndexOf("]")
      if (start !== -1 && end !== -1 && end > start) {
        const candidate = result.slice(start, end + 1)
        questions = JSON.parse(candidate)
      }
    } catch {
      // fall through
    }
    if (!questions) {
      console.error("Failed to parse quiz generation JSON. Raw result:", result)
      return []
    }
  }

  // Shuffle options for each question to ensure randomness
  // This prevents AI bias towards placing correct answers in position B
  return questions.map((q: any) => {
    if (!q.options || !Array.isArray(q.options)) return q

    // Find which option is the correct answer
    const correctAnswer = q.correctAnswer

    // Shuffle the options array using Fisher-Yates algorithm
    const shuffled = [...q.options]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    return {
      ...q,
      options: shuffled,
      correctAnswer: correctAnswer // Keep the same correct answer text
    }
  })
}

export async function createQuizGenerationChain(
  content: string,
  difficulty: "easy" | "medium" | "hard" = "medium",
  numQuestions: number = 5,
  provider?: AIProvider
) {
  const aiProvider = provider || getDefaultProvider()

  try {
    // Try with specified provider (Groq by default)
    return await runQuizGenerationWithProvider(content, difficulty, numQuestions, aiProvider)
  } catch (error: any) {
    // If Groq fails, automatically fallback to OpenAI
    if (aiProvider === "groq") {
      console.warn(`Groq quiz generation failed, falling back to OpenAI:`, error.message)
      try {
        return await runQuizGenerationWithProvider(content, difficulty, numQuestions, "openai")
      } catch (fallbackError: any) {
        console.error("OpenAI fallback also failed:", fallbackError.message)
        throw fallbackError
      }
    }
    throw error
  }
}

async function runFlashcardGenerationWithProvider(
  content: string,
  numCards: number,
  provider: AIProvider
) {
  const llm = getLLMProvider({
    provider,
    model: provider === "groq" ? "llama-3.1-8b-instant" : "gpt-4o",
    temperature: 0.7,
    apiKey: getProviderApiKey(provider),
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

export async function createFlashcardGenerationChain(
  content: string,
  numCards: number = 10,
  provider?: AIProvider
) {
  const aiProvider = provider || getDefaultProvider()

  try {
    // Try with specified provider (Groq by default)
    return await runFlashcardGenerationWithProvider(content, numCards, aiProvider)
  } catch (error: any) {
    // If Groq fails, automatically fallback to OpenAI
    if (aiProvider === "groq") {
      console.warn(`Groq flashcard generation failed, falling back to OpenAI:`, error.message)
      try {
        return await runFlashcardGenerationWithProvider(content, numCards, "openai")
      } catch (fallbackError: any) {
        console.error("OpenAI fallback also failed:", fallbackError.message)
        throw fallbackError
      }
    }
    throw error
  }
}

