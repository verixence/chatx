import { ChatOpenAI } from "@langchain/openai"

export type AIProvider = "groq" | "openai"

export interface ProviderConfig {
  provider: AIProvider
  model: string
  temperature: number
  apiKey: string
}

export function getLLMProvider(config: ProviderConfig) {
  switch (config.provider) {
    case "groq":
      // Groq is the primary provider - uses OpenAI-compatible API
      return new ChatOpenAI({
        modelName: config.model || "llama-3.1-8b-instant",
        temperature: config.temperature || 0.7,
        openAIApiKey: config.apiKey,
        configuration: {
          baseURL: "https://api.groq.com/openai/v1",
        },
      })
    case "openai":
      // OpenAI is the fallback provider
      return new ChatOpenAI({
        modelName: config.model || "gpt-4o",
        temperature: config.temperature || 0.7,
        openAIApiKey: config.apiKey,
      })
    default:
      throw new Error(`Unsupported provider: ${config.provider}`)
  }
}

export function getDefaultProvider(): AIProvider {
  // Groq is the primary/default provider
  return (process.env.AI_PROVIDER as AIProvider) || "groq"
}

export function getProviderApiKey(provider: AIProvider): string {
  switch (provider) {
    case "groq":
      return process.env.GROQ_API_KEY || ""
    case "openai":
      return process.env.OPENAI_API_KEY || ""
    default:
      return ""
  }
}

