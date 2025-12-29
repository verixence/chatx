import { getLLMProvider, getDefaultProvider, getProviderApiKey, type AIProvider } from "./providers"
import { generateEmbedding } from "./embeddings"
import { PromptTemplate } from "@langchain/core/prompts"
import { RunnableSequence } from "@langchain/core/runnables"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { getEducationalPromptSuffix } from "@/lib/safety/moderation"

interface Chunk {
  text: string
  metadata?: {
    page?: number
    timestamp?: string
    [key: string]: any
  }
}

export async function createRAGChain(
  query: string,
  chunks: Chunk[],
  context: {
    workspaceId: string
    userId: string
    provider?: AIProvider
    conversationHistory?: Array<{ role: string; content: string }>
    contentTitle?: string
    contentType?: string
  }
) {
  const aiProvider = context.provider || getDefaultProvider()
  const llm = getLLMProvider({
    provider: aiProvider,
    model: aiProvider === "groq" ? "llama-3.1-8b-instant" : "gpt-4o",
    temperature: 0.3, // Lower temperature for more focused, factual answers
    apiKey: getProviderApiKey(aiProvider),
  })

  // Combine relevant chunks
  const contextText = chunks
    .map((chunk, idx) => {
      const metadata = chunk.metadata || {}
      const source = metadata.timestamp
        ? `[Timestamp: ${metadata.timestamp}]`
        : metadata.page
        ? `[Page ${metadata.page}]`
        : `[Section ${idx + 1}]`
      return `${source}\n${chunk.text}`
    })
    .join("\n\n---\n\n")

  // Build conversation context if available
  const conversationContext = context.conversationHistory && context.conversationHistory.length > 0
    ? `\n\nPrevious conversation:\n${context.conversationHistory
        .slice(-6) // Last 6 messages (3 exchanges)
        .map((msg) => `${msg.role === "user" ? "Student" : "Tutor"}: ${msg.content}`)
        .join("\n")}`
    : ""

  const contentInfo = context.contentTitle
    ? `\n\nContent: ${context.contentTitle}${context.contentType ? ` (${context.contentType})` : ""}`
    : ""

  const prompt = PromptTemplate.fromTemplate(`
You are an AI tutor helping a student understand their learning materials. You have access to the content transcript/text and the conversation history.${contentInfo}

Context from learning materials:
{context}${conversationContext}

Student's question: {query}

INSTRUCTIONS:
1. **Answer the student's question directly and clearly** using information from the provided context.
2. **Be conversational and helpful** - understand what the student is really asking. If they ask "why is ice turned to water", they want to understand the melting process, not just a definition of matter.
3. **Use the conversation history** to understand the context of follow-up questions and maintain continuity.
4. **If the answer is in the context**, provide a clear, detailed explanation with examples from the content.
5. **If the answer isn't fully in the context**, use what you can find and say: "Based on the content, [answer]. For more details, you might want to check [specific section/timestamp]."
6. **Format your response clearly**:
   - Use **bold** for key terms and concepts
   - Use headings (##) for main topics
   - Use bullet points for lists
   - Keep paragraphs short (2-3 lines max)
   - Use examples from the content when relevant
7. **Clean up transcript artifacts**: Remove mentions of "[Music]", "[Applause]", background noise, etc.
8. **When referencing specific parts**, use clean citations like "at 03:15" or "on page 2" (not raw [Timestamp:...] format).
9. **Be specific**: If the student asks about a specific phenomenon (like ice melting), explain the mechanism, not just general concepts.
10. **Stay focused on education**: Only answer questions related to the learning materials. If asked about unrelated topics, politely redirect to the content.

${getEducationalPromptSuffix()}

Answer the student's question:
`)

  const chain = RunnableSequence.from([
    prompt,
    llm,
    new StringOutputParser(),
  ])

  const answer = await chain.invoke({
    query,
    context: contextText,
  })

  // Post-process answer to ensure it's helpful and specific
  let finalAnswer = answer.trim()
  
  // If answer is too short or seems generic, try to enhance it with more context
  if (finalAnswer.length < 100 && chunks.length > 0) {
    // Answer might be too brief, check if we can add more relevant context
    const additionalContext = chunks.slice(0, 2)
      .map(c => c.text.substring(0, 150))
      .join(" ")
    if (additionalContext && !finalAnswer.toLowerCase().includes("doesn't appear")) {
      finalAnswer = `${finalAnswer}\n\nHere's more detail: ${additionalContext}...`
    }
  }

  // Extract references from chunks
  const references = chunks.map((chunk, idx) => ({
    text: chunk.text.substring(0, 200) + "...",
    metadata: chunk.metadata,
    index: idx,
  }))

  return {
    answer: finalAnswer,
    references,
  }
}

export function semanticSearch(chunks: Chunk[], query: string, topK: number = 5): Chunk[] {
  // Backwards-compatible keyword-based search (used if no embeddings are available).
  const queryLower = query.toLowerCase()
  const queryWords = queryLower.split(/\s+/)

  const scoredChunks = chunks.map((chunk) => {
    const textLower = chunk.text.toLowerCase()
    let score = 0

    for (const word of queryWords) {
      if (!word) continue
      const count = (textLower.match(new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || [])
        .length
      score += count
    }

    return { chunk, score }
  })

  return scoredChunks
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((item) => item.chunk)
}

export async function vectorSemanticSearch(
  chunks: Chunk[],
  embeddings: number[][] | null | undefined,
  query: string,
  topK: number = 5
): Promise<Chunk[]> {
  if (!embeddings || embeddings.length !== chunks.length) {
    // Fallback to keyword search when embeddings are not available or mismatched
    return semanticSearch(chunks, query, topK)
  }

  const queryEmbedding = await generateEmbedding(query)

  const scored = chunks.map((chunk, idx) => {
    const emb = embeddings[idx]
    const score = cosineSimilarity(queryEmbedding, emb)
    return { chunk, score }
  })

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((item) => item.chunk)
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return 0
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  if (normA === 0 || normB === 0) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

