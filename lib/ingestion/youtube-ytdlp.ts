/**
 * yt-dlp YouTube Transcript Integration
 * 
 * Reliable fallback method using yt-dlp to extract subtitles.
 * yt-dlp is a robust tool that handles YouTube's various subtitle formats.
 */

import YTDlpWrap from "yt-dlp-wrap"
import * as fs from "fs"
import * as path from "path"
import * as os from "os"

export interface TranscriptItem {
  text: string
  offset: number // in milliseconds
  duration: number // in milliseconds
}

const REQUEST_TIMEOUT_MS = 60000 // 60 seconds (yt-dlp can be slow)

/**
 * Fetch YouTube transcript using yt-dlp
 * 
 * @param videoId YouTube video ID
 * @returns Array of transcript items with timestamps, or null if failed
 */
export async function getTranscriptFromYtDlp(
  videoId: string
): Promise<TranscriptItem[] | null> {
  try {
    console.log(`[yt-dlp] Attempting to fetch transcript for video: ${videoId}`)

    // Check if yt-dlp is available (should be installed system-wide)
    // yt-dlp-wrap will try to find yt-dlp in PATH or download it
    const ytDlpWrap = new YTDlpWrap()

    // Create temporary directory for subtitle file
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "learnchat-ytdlp-"))
    const subtitlePath = path.join(tempDir, `subtitle_${videoId}.ttml`)

    try {
      // Use yt-dlp to download subtitles without downloading video
      // --skip-download: Don't download the video
      // --write-auto-sub: Write automatic subtitles if manual aren't available
      // --sub-lang en: Prefer English subtitles
      // --sub-format ttml: Use TTML format (preserves timestamps well)
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`

      await ytDlpWrap.execPromise([
        videoUrl,
        "--skip-download",
        "--write-auto-sub",
        "--write-sub",
        "--sub-lang",
        "en,en-US,en-GB",
        "--sub-format",
        "ttml",
        "--output",
        subtitlePath.replace(".ttml", ""), // yt-dlp adds extension
        "--no-warnings",
        "--quiet",
      ])

      // Find the actual subtitle file (yt-dlp may add different extensions)
      const allSubtitleFiles = fs
        .readdirSync(tempDir)
        .filter((f) => f.endsWith(".ttml") || f.endsWith(".vtt") || f.endsWith(".srt"))
      
      console.log(`[yt-dlp] Found subtitle files: ${allSubtitleFiles.join(", ")}`)
      
      // Prioritize English subtitle files
      const englishFiles = allSubtitleFiles.filter((f) => 
        f.includes(".en.") || f.includes(".en-") || f.includes("_en.") || f.includes("_en-")
      )
      
      const subtitleFiles = englishFiles.length > 0 ? englishFiles : allSubtitleFiles

      if (subtitleFiles.length === 0) {
        console.log(`[yt-dlp] No subtitle file found in ${tempDir}`)
        return null
      }
      
      // Log which file we're using
      console.log(`[yt-dlp] Using subtitle file: ${subtitleFiles[0]}`)

      const actualSubtitlePath = path.join(tempDir, subtitleFiles[0])
      const subtitleContent = fs.readFileSync(actualSubtitlePath, "utf-8")

      // Parse the subtitle file based on format
      const items = parseSubtitleFile(subtitleContent, subtitleFiles[0])

      // Cleanup
      fs.rmSync(tempDir, { recursive: true, force: true })

      if (items.length === 0) {
        console.log(`[yt-dlp] Parsed subtitle file but got no items`)
        return null
      }

      console.log(
        `[yt-dlp] Successfully fetched transcript with ${items.length} items`
      )
      return items
    } catch (execError: any) {
      // Cleanup on error
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true })
      }

      const errorMsg = execError?.message || String(execError)
      
      // Check if it's a timeout or specific error
      if (errorMsg.includes("timeout") || errorMsg.includes("timed out")) {
        console.log(`[yt-dlp] Request timed out`)
        return null
      }

      // Check if subtitles are not available
      if (
        errorMsg.includes("subtitles") ||
        errorMsg.includes("caption") ||
        errorMsg.includes("has no subtitles")
      ) {
        console.log(`[yt-dlp] No subtitles available for this video`)
        return null
      }

      throw execError
    }
  } catch (error: any) {
    const errorMsg = error?.message || String(error)
    console.log(`[yt-dlp] Error fetching transcript: ${errorMsg}`)
    return null
  }
}

/**
 * Parse subtitle file based on format (TTML, VTT, or SRT)
 */
function parseSubtitleFile(content: string, filename: string): TranscriptItem[] {
  const ext = path.extname(filename).toLowerCase()

  if (ext === ".ttml" || ext === ".xml") {
    return parseTTML(content)
  } else if (ext === ".vtt") {
    return parseVTT(content)
  } else if (ext === ".srt") {
    return parseSRT(content)
  } else {
    // Try to detect format
    if (content.includes("<tt")) {
      return parseTTML(content)
    } else if (content.includes("WEBVTT")) {
      return parseVTT(content)
    } else {
      return parseSRT(content)
    }
  }
}

/**
 * Parse TTML (Timed Text Markup Language) format
 */
function parseTTML(xml: string): TranscriptItem[] {
  const items: TranscriptItem[] = []
  const textRegex = /<text[^>]*start="([^"]*)"[^>]*dur="([^"]*)"[^>]*>([^<]*)<\/text>/gi
  let match

  while ((match = textRegex.exec(xml)) !== null) {
    const start = parseFloat(match[1]) || 0
    const duration = parseFloat(match[2]) || 0
    const text = (match[3] || "").trim()

    // Clean HTML entities
    const cleanText = text
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#39;/g, "'")

    if (cleanText) {
      items.push({
        text: cleanText,
        offset: start * 1000, // Convert to milliseconds
        duration: duration * 1000,
      })
    }
  }

  return items
}

/**
 * Parse WebVTT format
 */
function parseVTT(vtt: string): TranscriptItem[] {
  const items: TranscriptItem[] = []
  const lines = vtt.split("\n")
  let currentText = ""
  let currentStart = 0
  let currentEnd = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Skip WEBVTT header and metadata
    if (line === "WEBVTT" || line.startsWith("NOTE") || !line) {
      continue
    }

    // Check for timestamp line (format: 00:00:00.000 --> 00:00:00.000)
    const timestampMatch = line.match(
      /(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})\.(\d{3})/
    )

    if (timestampMatch) {
      // Save previous item if exists
      if (currentText) {
        items.push({
          text: currentText.trim(),
          offset: currentStart,
          duration: currentEnd - currentStart,
        })
        currentText = ""
      }

      // Parse timestamps
      const startHours = parseInt(timestampMatch[1])
      const startMinutes = parseInt(timestampMatch[2])
      const startSeconds = parseInt(timestampMatch[3])
      const startMs = parseInt(timestampMatch[4])
      currentStart =
        (startHours * 3600 + startMinutes * 60 + startSeconds) * 1000 + startMs

      const endHours = parseInt(timestampMatch[5])
      const endMinutes = parseInt(timestampMatch[6])
      const endSeconds = parseInt(timestampMatch[7])
      const endMs = parseInt(timestampMatch[8])
      currentEnd =
        (endHours * 3600 + endMinutes * 60 + endSeconds) * 1000 + endMs
    } else if (currentStart > 0) {
      // This is text content for the current timestamp
      currentText += (currentText ? " " : "") + line.replace(/<[^>]*>/g, "") // Remove HTML tags
    }
  }

  // Add final item
  if (currentText) {
    items.push({
      text: currentText.trim(),
      offset: currentStart,
      duration: currentEnd - currentStart,
    })
  }

  return items
}

/**
 * Parse SRT (SubRip) format
 */
function parseSRT(srt: string): TranscriptItem[] {
  const items: TranscriptItem[] = []
  const srtRegex =
    /(\d+)\n(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})\n([\s\S]*?)(?=\d+\n|\n*$)/g
  let srtMatch

  while ((srtMatch = srtRegex.exec(srt)) !== null) {
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

    const text = (srtMatch[10] || "")
      .trim()
      .replace(/\n/g, " ")
      .replace(/<[^>]*>/g, "") // Remove HTML tags

    if (text) {
      items.push({
        text,
        offset: start,
        duration,
      })
    }
  }

  return items
}

