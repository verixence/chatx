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
        model: config.model || "llama-3.1-8b-instant",
        temperature: config.temperature || 0.7,
        apiKey: config.apiKey,
        configuration: {
          baseURL: "https://api.groq.com/openai/v1",
        },
      })
    case "openai":
      // OpenAI is the fallback provider
      return new ChatOpenAI({
        model: config.model || "gpt-4o",
        temperature: config.temperature || 0.7,
        apiKey: config.apiKey,
      })
    default:
      throw new Error(`Unsupported provider: ${config.provider}`)
  }
}

export function getDefaultProvider(): AIProvider {
  // Always use Groq as default (OpenAI is fallback)
  return "groq"
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

/**
 * Get LLM with automatic fallback from Groq to OpenAI
 * Tries Groq first (faster, cheaper), falls back to OpenAI if it fails
 */
export async function getLLMWithFallback(temperature: number = 0.7) {
  try {
    // Try Groq first
    const groqKey = getProviderApiKey("groq")
    if (groqKey) {
      return {
        llm: getLLMProvider({
          provider: "groq",
          model: "llama-3.1-8b-instant",
          temperature,
          apiKey: groqKey,
        }),
        provider: "groq" as AIProvider,
      }
    }
  } catch (error) {
    console.warn("Groq provider unavailable, falling back to OpenAI:", error)
  }

  // Fallback to OpenAI
  const openaiKey = getProviderApiKey("openai")
  if (!openaiKey) {
    throw new Error("No AI provider available - both Groq and OpenAI keys are missing")
  }

  return {
    llm: getLLMProvider({
      provider: "openai",
      model: "gpt-4o",
      temperature,
      apiKey: openaiKey,
    }),
    provider: "openai" as AIProvider,
  }
}

