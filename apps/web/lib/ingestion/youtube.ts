import { YoutubeTranscript } from "youtube-transcript"
import { getTranscriptFromSupadata } from "./youtube-supadata"
import { getTranscriptFromYtDlp } from "./youtube-ytdlp"

export interface YouTubeTranscriptItem {
  text: string
  offset: number
  duration: number
}

/**
 * Attempts multiple methods to fetch YouTube transcript with resilient fallback chain:
 * 1. Supadata.ai API (primary, reliable, avoids bot detection)
 * 2. yt-dlp (highly reliable fallback)
 * 3. youtube-transcript package (existing method)
 * 4. Direct timedtext endpoint (existing method)
 * 5. Page scraping (existing method)
 */
async function fetchTranscriptWithFallbacks(videoId: string, videoUrl?: string): Promise<YouTubeTranscriptItem[]> {
  const errors: string[] = []

  // Method 1: Supadata.ai API (primary method, most reliable)
  try {
    console.log(`[Method 1 - Supadata] Attempting to fetch transcript for video: ${videoId}`)
    const supadataUrl = videoUrl || `https://www.youtube.com/watch?v=${videoId}`
    const supadataItems = await getTranscriptFromSupadata(supadataUrl)
    
    if (supadataItems && supadataItems.length > 0) {
      console.log(`[Method 1 - Supadata] Success! Got ${supadataItems.length} transcript items`)
      return supadataItems
    }
    console.log(`[Method 1 - Supadata] No transcript returned (may not be configured or video not available)`)
  } catch (error: any) {
    const errorMsg = error?.message || String(error)
    errors.push(`Method 1 (Supadata): ${errorMsg}`)
    console.log(`[Method 1 - Supadata] Failed: ${errorMsg}`)
  }

  // Method 2: yt-dlp (reliable fallback)
  try {
    console.log(`[Method 2 - yt-dlp] Attempting to fetch transcript for video: ${videoId}`)
    const ytdlpItems = await getTranscriptFromYtDlp(videoId)
    
    if (ytdlpItems && ytdlpItems.length > 0) {
      console.log(`[Method 2 - yt-dlp] Success! Got ${ytdlpItems.length} transcript items`)
      return ytdlpItems
    }
    console.log(`[Method 2 - yt-dlp] No transcript returned`)
  } catch (error: any) {
    const errorMsg = error?.message || String(error)
    errors.push(`Method 2 (yt-dlp): ${errorMsg}`)
    console.log(`[Method 2 - yt-dlp] Failed: ${errorMsg}`)
  }

  // Method 3: Use youtube-transcript package with preferred languages
  const preferredLangs = ["en", "en-US", "en-GB", "asr"]

  if (YoutubeTranscript && typeof (YoutubeTranscript as any).fetchTranscript === "function") {
    for (const lang of preferredLangs) {
      try {
        console.log(
          `[Method 3 - youtube-transcript] Attempting transcript fetch for ${videoId} with lang=${lang}`
        )
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawItems: any[] = await (YoutubeTranscript as any).fetchTranscript(videoId, { lang })
        if (rawItems && rawItems.length > 0) {
          console.log(
            `[Method 3 - youtube-transcript] Success with lang=${lang}! Got ${rawItems.length} transcript items`
          )
          // Package already returns { text, offset, duration } in ms; just pass through
          return rawItems.map((item): YouTubeTranscriptItem => ({
            text: item.text || "",
            offset: typeof item.offset === "number" ? item.offset : 0,
            duration: typeof item.duration === "number" ? item.duration : 0,
          }))
        } else {
          errors.push(`Method 3 (${lang}): Transcript returned empty array`)
          console.log(`[Method 3 - youtube-transcript] Got empty transcript array for lang=${lang}`)
        }
      } catch (error: any) {
        const errorMsg = error?.message || String(error)
        errors.push(`Method 3 (${lang}): ${errorMsg}`)
        console.log(`[Method 3 - youtube-transcript] Failed with lang=${lang}: ${errorMsg}`)
      }
    }
  } else {
    console.log(
      "[Method 3 - youtube-transcript] YoutubeTranscript.fetchTranscript not available, skipping library-based fetch"
    )
  }

  // Method 4: Direct timedtext endpoint (no API key required)
  const timedTextLangs = ["en", "en-US", "en-GB"]
  for (const lang of timedTextLangs) {
    try {
      console.log(
        `[Method 4 - timedtext] Attempting transcript fetch via timedtext endpoint for ${videoId} with lang=${lang}`
      )
      const url = `https://video.google.com/timedtext?lang=${encodeURIComponent(
        lang
      )}&v=${encodeURIComponent(videoId)}`
      
      // Add timeout to fetch request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout
      
      try {
        const response = await fetch(url, { signal: controller.signal })
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          throw new Error(`Timedtext request failed with status ${response.status}`)
        }
        const xml = await response.text()
        const items = parseXMLCaptions(xml)
        if (items && items.length > 0) {
          console.log(
            `[Method 4 - timedtext] Success via timedtext with lang=${lang}! Got ${items.length} transcript items`
          )
          return items
        } else {
          errors.push(`Method 4 (${lang}): Timedtext returned empty array`)
          console.log(`[Method 4 - timedtext] Timedtext returned empty transcript for lang=${lang}`)
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId)
        if (fetchError.name === "AbortError") {
          throw new Error("Request timed out")
        }
        throw fetchError
      }
    } catch (error: any) {
      const errorMsg = error?.message || String(error)
      errors.push(`Method 4 (${lang}): ${errorMsg}`)
      console.log(`[Method 4 - timedtext] Timedtext failed for lang=${lang}: ${errorMsg}`)
    }
  }

  // Method 5: Direct scraping from YouTube page (last resort before ASR)
  try {
    console.log(`[Method 5 - scraping] Attempting to scrape transcript directly from YouTube page`)
    const items = await scrapeTranscriptFromPage(videoId)
    if (items && items.length > 0) {
      console.log(`[Method 5 - scraping] Success! Got ${items.length} transcript items via scraping`)
      return items
    } else {
      errors.push(`Method 5 (scraping): Transcript returned empty array`)
      console.log(`[Method 5 - scraping] Got empty transcript from scraping`)
    }
  } catch (error: any) {
    const errorMsg = error?.message || String(error)
    errors.push(`Method 5 (scraping): ${errorMsg}`)
    console.log(`[Method 5 - scraping] Failed: ${errorMsg}`)
  }
  
  // All caption-based methods failed
  // Return empty array to allow ASR fallback in getYouTubeTranscript
  console.log(`[fetchTranscriptWithFallbacks] All caption-based methods failed. Errors: ${errors.join('; ')}`)
  return []
}

/**
 * Scrape transcript directly from YouTube's video page
 * This is a fallback method when the library fails
 */
async function scrapeTranscriptFromPage(videoId: string): Promise<YouTubeTranscriptItem[]> {
  try {
    // Fetch the YouTube watch page with timeout
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout
    
    try {
      const response = await fetch(watchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        signal: controller.signal
      })
      clearTimeout(timeoutId)
    
      if (!response.ok) {
        throw new Error(`Failed to fetch YouTube page: ${response.statusText}`)
      }
      
      const html = await response.text()
    
    // Try to extract transcript data from the page
    // YouTube stores transcript data in various places in the HTML
    
    // Method 5a: Look for ytInitialPlayerResponse
    const playerResponseMatch = html.match(/var ytInitialPlayerResponse = ({.+?});/)
    if (playerResponseMatch) {
      try {
        const playerResponse = JSON.parse(playerResponseMatch[1])
        const captions = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks
        if (captions && captions.length > 0) {
          // Found caption tracks, try to fetch the base URL
          const baseUrl = captions[0]?.baseUrl
          if (baseUrl) {
            console.log(`[Method 5a] Found caption track, fetching transcript...`)
            const transcriptResponse = await fetch(baseUrl)
            if (transcriptResponse.ok) {
              const transcriptXml = await transcriptResponse.text()
              const items = parseXMLCaptions(transcriptXml)
              if (items.length > 0) {
                return items
              }
            }
          }
        }
      } catch (parseError) {
        console.log(`[Method 5a] Failed to parse player response: ${parseError}`)
      }
    }
    
    // Method 5b: Look for ytInitialData
    const initialDataMatch = html.match(/var ytInitialData = ({.+?});/)
    if (initialDataMatch) {
      try {
        const initialData = JSON.parse(initialDataMatch[1])
        // Navigate through the data structure to find captions
        // This structure can vary, so we try multiple paths
        const videoDetails = initialData?.contents?.twoColumnWatchNextResults?.results?.results?.contents
        // Additional parsing logic would go here
      } catch (parseError) {
        console.log(`[Method 5b] Failed to parse initial data: ${parseError}`)
      }
    }
    
    // Method 5c: Look for transcript in page source directly
    // Some videos have transcript data embedded in the HTML
    const transcriptMatch = html.match(/"captionTracks":\[({.+?})\]/)
    if (transcriptMatch) {
      try {
        const captionData = JSON.parse(`[${transcriptMatch[1]}]`)
        if (captionData[0]?.baseUrl) {
          const transcriptResponse = await fetch(captionData[0].baseUrl)
          if (transcriptResponse.ok) {
            const transcriptXml = await transcriptResponse.text()
            const items = parseXMLCaptions(transcriptXml)
            if (items.length > 0) {
              return items
            }
          }
        }
      } catch (parseError) {
        console.log(`[Method 5c] Failed to parse caption tracks: ${parseError}`)
      }
    }
    
      return []
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      if (fetchError.name === "AbortError") {
        throw new Error("Request timed out")
      }
      throw fetchError
    }
  } catch (error: any) {
    throw new Error(`Failed to scrape transcript from page: ${error?.message || error}`)
  }
}

/**
 * Parse XML/TTML captions into transcript items
 * Note: YouTube API returns captions in various formats (SRT, TTML, etc.)
 */
function parseXMLCaptions(xmlText: string): YouTubeTranscriptItem[] {
  const items: any[] = []
  
  // Try to parse as TTML (Timed Text Markup Language)
  // This is a simplified regex-based parser
  const textRegex = /<text[^>]*start="([^"]*)"[^>]*dur="([^"]*)"[^>]*>([^<]*)<\/text>/gi
  let match
  
  while ((match = textRegex.exec(xmlText)) !== null) {
    const start = parseFloat(match[1]) || 0
    const duration = parseFloat(match[2]) || 0
    const text = (match[3] || "").trim()
    
    if (text) {
      items.push({
        text,
        offset: start * 1000, // Convert to milliseconds
        duration: duration * 1000,
      })
    }
  }
  
  // If no TTML format found, try SRT format
  if (items.length === 0) {
    const srtRegex = /(\d+)\n(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})\n([\s\S]*?)(?=\d+\n|\n*$)/g
    let srtMatch
    
    while ((srtMatch = srtRegex.exec(xmlText)) !== null) {
      const startHours = parseInt(srtMatch[2]) || 0
      const startMinutes = parseInt(srtMatch[3]) || 0
      const startSeconds = parseInt(srtMatch[4]) || 0
      const startMs = parseInt(srtMatch[5]) || 0
      
      const endHours = parseInt(srtMatch[6]) || 0
      const endMinutes = parseInt(srtMatch[7]) || 0
      const endSeconds = parseInt(srtMatch[8]) || 0
      const endMs = parseInt(srtMatch[9]) || 0
      
      const start = (startHours * 3600 + startMinutes * 60 + startSeconds) * 1000 + startMs
      const end = (endHours * 3600 + endMinutes * 60 + endSeconds) * 1000 + endMs
      const duration = end - start
      const text = (srtMatch[10] || "").trim().replace(/\n/g, " ")
      
      if (text) {
        items.push({
          text,
          offset: start,
          duration,
        })
      }
    }
  }
  
  return items
}

export async function getYouTubeTranscript(
  videoId: string,
  options?: { videoUrl?: string }
): Promise<{
  transcript: string
  items: YouTubeTranscriptItem[]
  metadata: {
    videoId: string
    totalDuration: number
    transcriptSource?: "captions" | "supadata" | "ytdlp"
  }
}> {
  let transcriptItems: YouTubeTranscriptItem[] = []
  let transcriptSource: "captions" | "supadata" | "ytdlp" | undefined

  try {
    // 1) Try caption-based methods first (includes Supadata, yt-dlp, and existing fallbacks)
    const rawItems = await fetchTranscriptWithFallbacks(videoId, options?.videoUrl)
    if (Array.isArray(rawItems) && rawItems.length > 0) {
      transcriptItems = rawItems
      // Determine source based on which method succeeded (inferred from log messages)
      // Default to "captions" for compatibility
      transcriptSource = "captions"
    }

    // If no transcript found after all methods, throw error
    if (!transcriptItems || transcriptItems.length === 0) {
      throw new Error(
        "Unable to fetch transcript for this video. The video may not have captions available, " +
        "or all transcript fetching methods failed. Please try a different video with captions enabled, " +
        "or use the Text upload option to paste the transcript manually."
      )
    }

    const transcript = transcriptItems.map((item) => item.text).join(" ")

    if (!transcript || transcript.trim().length === 0) {
      throw new Error("Transcript contains no text. The video may not have captions available.")
    }

    // Calculate total duration: last item's offset + its duration
    const lastItem = transcriptItems[transcriptItems.length - 1]
    const totalDuration = lastItem ? lastItem.offset + (lastItem.duration || 0) : 0

    console.log(
      `Successfully fetched transcript via ${transcriptSource || "unknown"}: ${
        transcript.length
      } characters, ${transcriptItems.length} items, duration: ${totalDuration}ms`
    )

    return {
      transcript,
      items: transcriptItems,
      metadata: {
        videoId,
        totalDuration,
        transcriptSource,
      },
    }
  } catch (error: any) {
    console.error("YouTube transcript overall failure:", error)
    throw new Error(
      error?.message ||
        `Failed to fetch or transcribe YouTube transcript. Video ID: ${videoId}`
    )
  }
}


export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

export function chunkTranscriptWithTimestamps(
  items: YouTubeTranscriptItem[],
  chunkSize: number = 1000
): Array<{ text: string; timestamp: string; index: number }> {
  const chunks: Array<{ text: string; timestamp: string; index: number }> = []
  let currentChunk: string[] = []
  let currentLength = 0
  let startTimestamp = items[0]?.offset || 0
  let index = 0

  for (const item of items) {
    if (currentLength + item.text.length > chunkSize && currentChunk.length > 0) {
      // Save current chunk
      const timestamp = formatTimestamp(startTimestamp)
      chunks.push({
        text: currentChunk.join(" "),
        timestamp,
        index,
      })
      index++

      // Start new chunk
      currentChunk = [item.text]
      currentLength = item.text.length
      startTimestamp = item.offset
    } else {
      currentChunk.push(item.text)
      currentLength += item.text.length + 1
    }
  }

  // Add final chunk
  if (currentChunk.length > 0) {
    const timestamp = formatTimestamp(startTimestamp)
    chunks.push({
      text: currentChunk.join(" "),
      timestamp,
      index,
    })
  }

  return chunks
}

function formatTimestamp(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  const s = seconds % 60
  const m = minutes % 60

  if (hours > 0) {
    return `${hours}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }
  return `${m}:${s.toString().padStart(2, "0")}`
}

