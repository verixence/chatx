import { OpenAIEmbeddings } from "@langchain/openai"

let embeddingsInstance: OpenAIEmbeddings | null = null

export function getEmbeddings() {
  if (!embeddingsInstance) {
    embeddingsInstance = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "text-embedding-3-small",
    })
  }
  return embeddingsInstance
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const embeddings = getEmbeddings()
  const result = await embeddings.embedQuery(text)
  return result
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddings = getEmbeddings()
  const result = await embeddings.embedDocuments(texts)
  return result
}

