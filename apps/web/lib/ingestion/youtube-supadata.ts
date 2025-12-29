/**
 * Supadata.ai YouTube Transcript Integration
 * 
 * Primary method for fetching YouTube transcripts to avoid bot detection.
 * Uses Supadata.ai's API which provides reliable transcript access.
 */

export interface TranscriptItem {
  text: string
  offset: number // in milliseconds
  duration: number // in milliseconds
}

const SUPADATA_API_URL = "https://api.supadata.ai/v1/youtube/transcript"
// Note: Authentication uses x-api-key header (lowercase) per Supadata docs
const REQUEST_TIMEOUT_MS = 30000 // 30 seconds

/**
 * Fetch YouTube transcript using Supadata.ai API
 * 
 * @param urlOrVideoId YouTube URL or video ID
 * @returns Array of transcript items with timestamps, or null if failed
 */
export async function getTranscriptFromSupadata(
  urlOrVideoId: string
): Promise<TranscriptItem[] | null> {
  const apiKey = process.env.SUPADATA_API_KEY

  // Skip if API key is not configured
  if (!apiKey || apiKey.trim().length === 0) {
    console.log("[Supadata] API key not configured, skipping")
    return null
  }
  
  // Skip if API key looks invalid (starts with placeholder text)
  if (apiKey.includes("your-") || apiKey.includes("example") || apiKey.length < 10) {
    console.log("[Supadata] API key appears to be a placeholder, skipping")
    return null
  }

  // Extract video ID if URL is provided
  let videoId = urlOrVideoId
  if (urlOrVideoId.includes("youtube.com") || urlOrVideoId.includes("youtu.be")) {
    const videoIdMatch = urlOrVideoId.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
    )
    if (videoIdMatch && videoIdMatch[1]) {
      videoId = videoIdMatch[1]
    } else {
      console.log(`[Supadata] Failed to extract video ID from URL: ${urlOrVideoId}`)
      return null
    }
  }

  try {
    console.log(`[Supadata] Attempting to fetch transcript for video: ${videoId}`)

    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      // Supadata API uses x-api-key header (lowercase) per documentation
      // See: https://docs.supadata.ai/api-reference/introduction
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-api-key": apiKey, // Required: lowercase x-api-key header
      }

      // Supadata API uses GET with query parameters
      // Use videoId if we have it, otherwise use full URL
      // Add lang=en to prefer English transcripts
      const baseParam = videoId !== urlOrVideoId 
        ? `videoId=${encodeURIComponent(videoId)}`
        : `url=${encodeURIComponent(urlOrVideoId)}`
      
      // Try English first
      const queryParam = `${baseParam}&lang=en`
      
      const response = await fetch(`${SUPADATA_API_URL}?${queryParam}`, {
        method: "GET",
        headers,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.log(
          `[Supadata] API request failed with status ${response.status}: ${errorText}`
        )
        // Log detailed error for debugging
        try {
          const errorJson = JSON.parse(errorText)
          console.log(`[Supadata] Error details:`, errorJson)
        } catch {
          // Error text is not JSON, just log as-is
        }
        return null
      }

      const data = await response.json()

      // Parse the response based on Supadata.ai's actual format
      // Response format: { lang: "en", availableLangs: [...], content: [...] }
      // Each content item has: { lang, text, offset, duration }
      
      // Check if we got English transcript
      const receivedLang = data.lang || data.language || ""
      const availableLangs = data.availableLangs || data.available_langs || []
      
      console.log(`[Supadata] Received transcript in language: ${receivedLang}, available: ${JSON.stringify(availableLangs)}`)
      
      // If we didn't get English and English is available, return null to trigger retry
      const englishLangs = ["en", "en-US", "en-GB", "en-AU", "en-CA"]
      const isEnglish = englishLangs.some(lang => 
        receivedLang.toLowerCase().startsWith(lang.toLowerCase()) || 
        receivedLang.toLowerCase() === lang.toLowerCase()
      )
      const hasEnglishAvailable = Array.isArray(availableLangs) && availableLangs.some((lang: string) => 
        englishLangs.some(enLang => lang.toLowerCase().startsWith(enLang.toLowerCase()))
      )
      
      // If we got a non-English transcript but English is available, return null to retry
      if (!isEnglish && hasEnglishAvailable) {
        console.log(`[Supadata] Got ${receivedLang} but English is available, returning null to retry`)
        return null
      }
      
      // Log warning if we're using non-English transcript
      if (!isEnglish && receivedLang) {
        console.log(`[Supadata] Warning: No English transcript available, using ${receivedLang}`)
      }
      
      let items: TranscriptItem[] = []

      if (data.content && Array.isArray(data.content)) {
        // Supadata returns transcript items in the 'content' array
        items = normalizeSupadataItems(data.content)
      } else if (Array.isArray(data)) {
        // Fallback: if response is directly an array
        items = normalizeSupadataItems(data)
      } else if (data.transcript && Array.isArray(data.transcript)) {
        // Fallback: if response has transcript property
        items = normalizeSupadataItems(data.transcript)
      } else if (data.items && Array.isArray(data.items)) {
        // Fallback: if response has items property
        items = normalizeSupadataItems(data.items)
      } else {
        console.log(`[Supadata] Unexpected response format:`, Object.keys(data))
        console.log(`[Supadata] Response preview:`, JSON.stringify(data).substring(0, 200))
        return null
      }

      if (items.length === 0) {
        console.log(`[Supadata] Received empty transcript array`)
        return null
      }

      console.log(
        `[Supadata] Successfully fetched transcript with ${items.length} items`
      )
      return items
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      if (fetchError.name === "AbortError") {
        console.log(`[Supadata] Request timed out after ${REQUEST_TIMEOUT_MS}ms`)
        return null
      }
      throw fetchError
    }
  } catch (error: any) {
    const errorMsg = error?.message || String(error)
    console.log(`[Supadata] Error fetching transcript: ${errorMsg}`)
    return null
  }
}

/**
 * Normalize Supadata.ai response items to our standard format
 * Handles various possible response structures
 */
function normalizeSupadataItems(rawItems: any[]): TranscriptItem[] {
  return rawItems
    .map((item) => {
      // Supadata format: { lang, text, offset, duration }
      // offset and duration are already in milliseconds
      const text = item.text || item.content || item.transcript || ""
      // offset and duration are already in milliseconds in Supadata response
      const offset = typeof item.offset === "number" ? item.offset : parseTimeToMs(item.start || item.offset || item.time || 0)
      const duration = typeof item.duration === "number" ? item.duration : parseTimeToMs(item.duration || 0)

      if (!text || text.trim().length === 0) {
        return null
      }

      return {
        text: text.trim(),
        offset,
        duration,
      }
    })
    .filter((item): item is TranscriptItem => item !== null)
}

/**
 * Parse time value to milliseconds
 * Handles both seconds (number/string) and milliseconds
 */
function parseTimeToMs(time: number | string): number {
  if (typeof time === "string") {
    // Try to parse timestamp string like "03:15" or "1:02:45"
    const parts = time.split(":").map(Number)
    if (parts.length === 2) {
      // MM:SS format
      return (parts[0] * 60 + parts[1]) * 1000
    } else if (parts.length === 3) {
      // HH:MM:SS format
      return (parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000
    }
    // Try parsing as number
    const num = parseFloat(time)
    // Assume seconds if < 10000, otherwise milliseconds
    return num < 10000 ? num * 1000 : num
  }

  // If number, assume seconds if < 10000, otherwise milliseconds
  return time < 10000 ? time * 1000 : time
}

