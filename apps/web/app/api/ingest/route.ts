import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth/middleware"
import {
  getUserById,
  updateUser,
  createContent,
  createProcessedContent,
  updateContent,
  getYoutubeContentsByRawUrl,
  getProcessedContentByContentId,
  getContentById,
  updateProcessedContent,
  getWorkspaceById,
  getUserContentCount,
} from "@/lib/db/queries"
import { canAddContent, isTrialExpired } from "@/lib/subscriptions/subscription"
import { supabaseAdmin } from "@/lib/db/supabase"
import { initializeBucket } from "@/lib/storage/supabase"

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY

/**
 * Sanitize text to remove null bytes and other problematic Unicode characters
 * that PostgreSQL cannot store in text fields
 */
function sanitizeText(text: string): string {
  if (!text) return text
  // Remove null bytes and other control characters that cause PostgreSQL errors
  return text
    .replace(/\u0000/g, '') // Remove null bytes
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove other control characters
    .trim()
}

// Generic subject names to skip when detecting chapter titles
const GENERIC_SUBJECTS = [
  'MATHEMATICS', 'MATH', 'MATHS',
  'SCIENCE', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY',
  'ENGLISH', 'HINDI', 'SOCIAL SCIENCE', 'HISTORY', 'GEOGRAPHY',
  'ECONOMICS', 'POLITICAL SCIENCE', 'CIVICS',
  'COMPUTER SCIENCE', 'INFORMATION TECHNOLOGY',
  'NCERT', 'CBSE', 'ICSE', 'TEXTBOOK'
]

// Common words that shouldn't be extracted as titles by themselves
const COMMON_WORDS = [
  // Section headings (with and without Roman numerals)
  'INTRODUCTION', 'I. INTRODUCTION', 'I INTRODUCTION', '1. INTRODUCTION', '1 INTRODUCTION',
  'ABSTRACT', 'METHODOLOGY', 'METHODS', 'MATERIALS AND METHODS',
  'RESULTS', 'DISCUSSION', 'RESULTS AND DISCUSSION',
  'CONCLUSION', 'CONCLUSIONS', 'CONCLUDING REMARKS',
  'REFERENCES', 'BIBLIOGRAPHY', 'ACKNOWLEDGMENTS', 'ACKNOWLEDGEMENTS',
  'APPENDIX', 'APPENDICES', 'SUPPLEMENTARY', 'SUPPLEMENTARY MATERIALS',
  // Chapter/section markers
  'CHAPTER', 'SECTION', 'UNIT', 'PART', 'PAGE',
  'CONTENTS', 'TABLE OF CONTENTS', 'INDEX', 'GLOSSARY',
  'EXERCISE', 'EXERCISES', 'PROBLEMS', 'SOLUTIONS', 'ANSWERS',
  'NOTES', 'SUMMARY', 'REVIEW', 'TEST', 'QUIZ',
  // Common nouns that might appear but aren't titles
  'LOCKERS', 'LOCKER', 'PERSON', 'PEOPLE', 'NUMBER', 'NUMBERS',
  'QUEEN', 'KING', 'MINISTER', 'PUZZLE', 'PROBLEM', 'ANSWER',
  'FORTUNE', 'STONE', 'STONES', 'RELATIVES', 'INHERITANCE',
  // Single letters/numbers that might be picked up
  'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
]

// Check if line looks like a section heading (e.g., "I. INTRODUCTION", "1. Methods")
function isSectionHeading(text: string): boolean {
  const normalized = text.trim()
  // Roman numeral patterns: "I.", "II.", "III.", "IV.", "V.", etc. followed by text
  if (/^(I{1,3}|IV|VI{0,3}|IX|X{1,3})\.?\s+/i.test(normalized)) return true
  // Numeric patterns: "1.", "2.", "1.1", "2.1" followed by text
  if (/^\d+\.?\d*\.?\s+/i.test(normalized)) return true
  // Check if it's a known section heading
  const upperNormalized = normalized.toUpperCase()
  if (COMMON_WORDS.includes(upperNormalized)) return true
  // Check without leading number/roman numeral
  const withoutPrefix = normalized.replace(/^(I{1,3}|IV|VI{0,3}|IX|X{1,3}|\d+)\.?\s*/i, '').toUpperCase()
  if (COMMON_WORDS.includes(withoutPrefix)) return true
  return false
}

function isGenericSubject(text: string): boolean {
  const normalized = text.trim().toUpperCase()
  return GENERIC_SUBJECTS.some(subject => normalized === subject)
}

function isCommonWord(text: string): boolean {
  const normalized = text.trim().toUpperCase()
  // Direct match
  if (COMMON_WORDS.includes(normalized)) return true
  // Check without leading Roman numerals or numbers
  const withoutPrefix = normalized.replace(/^(I{1,3}|IV|VI{0,3}|IX|X{1,3}|\d+)\.?\s*/i, '')
  if (COMMON_WORDS.includes(withoutPrefix)) return true
  return false
}

function isBetterTitle(newTitle: string, currentTitle: string | null): boolean {
  if (!currentTitle) return true
  // Prefer longer, multi-word titles
  const newWords = newTitle.split(/\s+/).length
  const currentWords = currentTitle.split(/\s+/).length
  if (newWords > currentWords && newWords >= 3) return true
  // Prefer titles with "AND" or similar connectors (indicate full titles)
  if (/\bAND\b|\bOR\b|\bOF\b|\bTHE\b|\bA\b/i.test(newTitle) && newWords >= 3) return true
  return false
}

function extractFirstHeading(text: string) {
  // Get first 4000 characters (first page or two)
  const firstPageText = text.substring(0, 4000)
  const lines = firstPageText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  
  let bestTitle: string | null = null
  
  // PRIORITY 0: Look for research paper titles (long, Title Case, before author names)
  // Research paper titles are usually the first significant text, often spanning multiple lines
  // They appear BEFORE "Abstract", author names, affiliations, etc.
  const abstractIndex = lines.findIndex(l => /^abstract/i.test(l.trim()))
  const introductionIndex = lines.findIndex(l => /^(I\.?\s+)?INTRODUCTION$/i.test(l.trim()))
  const searchLimit = Math.min(
    abstractIndex > 0 ? abstractIndex : 15,
    introductionIndex > 0 ? introductionIndex : 15,
    20
  )
  
  // Look for long Title Case lines that could be paper titles
  for (let i = 0; i < searchLimit && i < lines.length; i++) {
    const line = lines[i]
    
    // Skip very short lines, section headings, and common patterns
    if (line.length < 15) continue
    if (isSectionHeading(line)) continue
    if (isGenericSubject(line)) continue
    if (isCommonWord(line)) continue
    
    // Skip lines that look like author names (contain @ or institutional keywords)
    if (/@|university|institute|department|college/i.test(line)) continue
    
    // Skip lines that are just numbers or single words
    const words = line.split(/\s+/)
    if (words.length < 3) continue
    
    // Check if line has good title characteristics
    const hasUpperCase = (line.match(/[A-Z]/g) || []).length
    const hasLowerCase = (line.match(/[a-z]/g) || []).length
    const letterCount = hasUpperCase + hasLowerCase
    
    // Research paper title pattern: Title Case with many words
    // e.g., "Automated Trading System for Stock Index Using LSTM Neural Networks"
    if (words.length >= 5 && line.length >= 30) {
      // Check if most words start with capital letters (Title Case)
      const capitalizedWords = words.filter(w => /^[A-Z]/.test(w)).length
      if (capitalizedWords >= words.length * 0.5) {
        console.log(`[extractFirstHeading] Found research paper title: "${line}"`)
        return line
      }
    }
    
    // Check for mixed case longer titles
    if (line.length >= 40 && letterCount > 0 && hasUpperCase > 0 && hasLowerCase > 0) {
      // This looks like a proper title (mixed case, long)
      if (isBetterTitle(line, bestTitle)) {
        bestTitle = line
      }
    }
  }
  
  // Return research paper title if found
  if (bestTitle && bestTitle.length >= 30) {
    console.log(`[extractFirstHeading] Using best research paper title: "${bestTitle}"`)
    return bestTitle
  }
  
  // PRIORITY 1: Look for multi-word ALL CAPS titles (chapter titles)
  // Pattern: "A SQUARE AND A CUBE", "WORK AND ENERGY", etc.
  for (const line of lines.slice(0, 20)) {
    if (isSectionHeading(line)) continue // Skip section headings like "I. INTRODUCTION"
    
    const words = line.split(/\s+/)
    if (words.length >= 3 && words.length <= 12 && line.length >= 10 && line.length <= 150) {
      const upperCount = (line.match(/[A-Z]/g) || []).length
      const letterCount = (line.match(/[A-Za-z]/g) || []).length
      if (letterCount > 0 && upperCount / letterCount >= 0.8) {
        if (!isGenericSubject(line) && !isCommonWord(line)) {
          if (/\bAND\b|\bOR\b|\bOF\b|\bTHE\b|\bA\b|\bAN\b|\bFOR\b|\bUSING\b|\bWITH\b/i.test(line)) {
            console.log(`[extractFirstHeading] Found multi-word title: "${line}"`)
            return line
          }
          if (isBetterTitle(line, bestTitle)) {
            bestTitle = line
          }
        }
      }
    }
  }
  
  // PRIORITY 2: Look for title with chapter number pattern
  for (const line of lines.slice(0, 15)) {
    if (isSectionHeading(line)) continue
    
    const matchBefore = line.match(/^(\d+)\s+([A-Z][A-Za-z\s]{5,})$/)
    const matchAfter = line.match(/^([A-Z][A-Za-z\s]{5,})\s+(\d+)$/)
    
    if (matchBefore) {
      const titlePart = matchBefore[2].trim()
      if (titlePart.length >= 8 && !isGenericSubject(titlePart) && !isCommonWord(titlePart) && !isSectionHeading(titlePart)) {
        console.log(`[extractFirstHeading] Found numbered title: "${titlePart}"`)
        return titlePart
      }
    }
    if (matchAfter) {
      const titlePart = matchAfter[1].trim()
      if (titlePart.length >= 8 && !isGenericSubject(titlePart) && !isCommonWord(titlePart) && !isSectionHeading(titlePart)) {
        console.log(`[extractFirstHeading] Found numbered title: "${titlePart}"`)
        return titlePart
      }
    }
  }
  
  // Return best multi-word title found so far
  if (bestTitle && bestTitle.split(/\s+/).length >= 3) {
    console.log(`[extractFirstHeading] Using best multi-word title: "${bestTitle}"`)
    return bestTitle
  }
  
  // PRIORITY 3: Look for section pattern and find title before it
  const sectionMatch = firstPageText.match(/(\d+\.\d+)\s+([A-Z][a-z]+(?:\s+[A-Za-z]+)*)/m)
  if (sectionMatch) {
    const sectionIndex = lines.findIndex(l => l.includes(sectionMatch[0]))
    if (sectionIndex > 0) {
      for (let i = sectionIndex - 1; i >= Math.max(0, sectionIndex - 5); i--) {
        const line = lines[i]
        if (line.length >= 8 && line.length <= 80 && !isSectionHeading(line)) {
          const upperCount = (line.match(/[A-Z]/g) || []).length
          const letterCount = (line.match(/[A-Za-z]/g) || []).length
          if (letterCount > 0 && upperCount / letterCount >= 0.7 && 
              !isGenericSubject(line) && !isCommonWord(line)) {
            console.log(`[extractFirstHeading] Found title before section: "${line}"`)
            return line
          }
        }
      }
    }
  }
  
  // PRIORITY 4: Look for chapter title patterns
  const chapterLine = lines.find((l) => 
    l.length > 10 && l.length < 200 && /chapter\s+\d+/i.test(l) && !isSectionHeading(l)
  )
  if (chapterLine) return chapterLine
  
  // PRIORITY 5: Look for all-caps titles (skip section headings)
  const allCapsTitles = lines.filter((l) => {
    if (l.length < 6 || l.length > 100) return false
    if (isSectionHeading(l)) return false
    if (isGenericSubject(l) || isCommonWord(l)) return false
    const upperCount = (l.match(/[A-Z]/g) || []).length
    const letterCount = (l.match(/[A-Za-z]/g) || []).length
    if (letterCount === 0) return false
    return upperCount / letterCount >= 0.7
  })
  
  // Prefer longer titles over shorter ones
  const sortedTitles = allCapsTitles.sort((a, b) => b.length - a.length)
  if (sortedTitles.length > 0 && sortedTitles[0].split(/\s+/).length >= 2) {
    console.log(`[extractFirstHeading] Found all-caps title: "${sortedTitles[0]}"`)
    return sortedTitles[0]
  }
  
  // PRIORITY 6: Title case lines
  const titleLine = lines.find((l) => {
    if (l.length < 8 || l.length > 100) return false
    if (isSectionHeading(l)) return false
    if (isGenericSubject(l) || isCommonWord(l)) return false
    const words = l.split(/\s+/)
    if (words.length < 2 || words.length > 12) return false
    const capitalizedWords = words.filter(w => /^[A-Z]/.test(w)).length
    return capitalizedWords >= 2 && capitalizedWords / words.length >= 0.5
  })
  if (titleLine) return titleLine
  
  // Fallback
  return lines.find((l) => l.length > 6 && l.length < 100 && 
    !isSectionHeading(l) && !isGenericSubject(l) && !isCommonWord(l)) || null
}

function extractChapter(text: string) {
  // Get first 3000 characters for better detection
  const firstPageText = text.substring(0, 3000)
  const lines = firstPageText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  
  // PRIORITY 1: Look for title with chapter number like "POLYNOMIALS 2" or "2 POLYNOMIALS"
  for (const line of lines) {
    // Match "TITLE 2" or "2 TITLE" or "2. TITLE"
    const matchAfter = line.match(/^([A-Z][A-Za-z\s]+?)\s+(\d+)$/)
    const matchBefore = line.match(/^(\d+)\.?\s+([A-Z][A-Za-z\s]+)$/)
    
    if (matchAfter) {
      const titlePart = matchAfter[1].trim()
      const chapterNum = Number(matchAfter[2])
      if (titlePart.length >= 4 && !isGenericSubject(titlePart)) {
        return { chapter_number: chapterNum, chapter: titlePart }
      }
    }
    if (matchBefore) {
      const chapterNum = Number(matchBefore[1])
      const titlePart = matchBefore[2].trim()
      if (titlePart.length >= 4 && !isGenericSubject(titlePart)) {
        return { chapter_number: chapterNum, chapter: titlePart }
      }
    }
  }
  
  // PRIORITY 2: Try to match patterns like:
  // "Chapter 9 — The Amazing World..."
  // "Chapter 9: The Amazing World..."
  const patterns = [
    /chapter\s+(\d+)\s*[—–\-:]\s*([^\n\r]+?)(?:\n|$)/i,
    /chapter\s+(\d+)\s+([^\n\r]+?)(?:\n|$)/i,
  ]
  
  for (const pattern of patterns) {
    const match = firstPageText.match(pattern)
    if (match) {
      const chapterName = match[2].trim()
      const cleanChapterName = chapterName.replace(/\s+/g, ' ').substring(0, 150).trim()
      
      if (cleanChapterName.length > 3 && !isGenericSubject(cleanChapterName)) {
        return { chapter_number: Number(match[1]), chapter: cleanChapterName }
      }
    }
  }
  
  // PRIORITY 3: Look for section like "2.1 Introduction" and find chapter title before it
  const sectionMatch = firstPageText.match(/(\d+)\.(\d+)\s+([A-Z][a-z]+)/m)
  if (sectionMatch) {
    const chapterNum = Number(sectionMatch[1])
    const sectionIndex = lines.findIndex(l => l.includes(sectionMatch[0]))
    
    if (sectionIndex > 0) {
      // Look backwards for the chapter title (skip generic subjects)
      for (let i = sectionIndex - 1; i >= Math.max(0, sectionIndex - 8); i--) {
        const line = lines[i]
        if (line.length >= 4 && line.length <= 60) {
          const upperCount = (line.match(/[A-Z]/g) || []).length
          const letterCount = (line.match(/[A-Za-z]/g) || []).length
          
          if (letterCount > 0 && upperCount / letterCount >= 0.7 && !isGenericSubject(line)) {
            return { chapter_number: chapterNum, chapter: line }
          }
        }
      }
    }
  }
  
  // PRIORITY 4: Try to find chapter number and title on separate lines
  const chapterNumberMatch = firstPageText.match(/chapter\s+(\d+)/i)
  if (chapterNumberMatch) {
    const chapterNum = Number(chapterNumberMatch[1])
    const chapterIndex = lines.findIndex(l => /chapter\s+\d+/i.test(l))
    
    if (chapterIndex >= 0) {
      // Look at the next few lines for the title (skip generic subjects)
      for (let i = chapterIndex + 1; i < Math.min(chapterIndex + 6, lines.length); i++) {
        const line = lines[i]
        if (line.length >= 4 && line.length <= 100 && !isGenericSubject(line)) {
          const upperCount = (line.match(/[A-Z]/g) || []).length
          const letterCount = (line.match(/[A-Za-z]/g) || []).length
          
          if (letterCount > 0) {
            const upperRatio = upperCount / letterCount
            const words = line.split(/\s+/)
            
            // All caps title
            if ((words.length === 1 && letterCount >= 4 && upperRatio >= 0.7) ||
                (words.length > 1 && letterCount >= 5 && upperRatio >= 0.7)) {
              return { chapter_number: chapterNum, chapter: line.trim() }
            }
            
            // Title case
            if (words.length >= 2 && words.length <= 8) {
              const capitalizedWords = words.filter(w => /^[A-Z]/.test(w)).length
              if (capitalizedWords >= 2 && capitalizedWords / words.length >= 0.5) {
                return { chapter_number: chapterNum, chapter: line.trim() }
              }
            }
          }
        }
      }
    }
  }
  
  return { chapter_number: null, chapter: null }
}

function extractGrade(text: string) {
  const match = text.match(/\b(?:grade|class)\s+(\d{1,2})\b/i)
  return match ? Number(match[1]) : null
}

function stripChapterPrefix(title: string) {
  // Hyphen is escaped to avoid "range out of order" in some regex engines
  return title.replace(/^chapter\s+\d+\s*[—–\-:]*\s*/i, "").trim()
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const type = formData.get("type") as string
    const workspaceId = formData.get("workspaceId") as string
    const file = formData.get("file") as File | null
    const storagePath = formData.get("storagePath") as string | null
    const url = formData.get("url") as string | null
    const text = formData.get("text") as string | null

    // Fetch user
    const user = await getUserById(auth.userId)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if trial has expired
    if (user.subscription_status === 'trial' && isTrialExpired(user.subscription_status, user.subscription_end_date)) {
      return NextResponse.json(
        { 
          error: 'Your 14-day free trial has ended. Please upgrade to Pro to continue using the service.',
          code: 'TRIAL_EXPIRED',
        },
        { status: 403 }
      )
    }

    // Check subscription limits before processing
    const currentContentCount = await getUserContentCount(auth.userId)
    const subscriptionTier = (user.subscription as 'freemium' | 'pro' | 'enterprise') || 'freemium'
    const limitCheck = await canAddContent(currentContentCount, subscriptionTier)
    
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { 
          error: limitCheck.reason || 'Content limit reached',
          code: 'SUBSCRIPTION_LIMIT',
          limit: limitCheck.limit,
        },
        { status: 403 }
      )
    }

    // Minimal metadata for creation
    let metadata: any = {}
    let title: string | null = "Processing…"
    let thumbnail: string | null = null
    let source: string | null = null
    let storagePathFinal: string | null = storagePath

    // Basic validation per type (no heavy work)
    switch (type) {
      case "pdf":
        if (!file && !storagePathFinal) {
          return NextResponse.json(
            { error: "File or storagePath required for PDF" },
            { status: 400 }
          )
        }
        
        let pdfBuffer: Buffer | null = null
        
        // Ensure bucket exists and upload if file provided and no storagePath
        try {
          await initializeBucket()
          if (file && !storagePathFinal) {
            const arrayBuffer = await file.arrayBuffer()
            pdfBuffer = Buffer.from(arrayBuffer)
            const path = `pdfs/${workspaceId}/${Date.now()}-${file.name}`
            const { error: uploadError } = await supabaseAdmin.storage
              .from("learnchat-files")
              .upload(path, pdfBuffer, { contentType: "application/pdf", upsert: true })
            if (!uploadError) {
              storagePathFinal = path
            }
          }
        } catch (e) {
          console.warn("Bucket or upload warning:", e)
        }
        
        // QUICK TITLE EXTRACTION - Extract title BEFORE creating content record
        // This ensures title is available immediately when user lands on content page
        let quickPdfTitle: string | null = null
        let quickChapterInfo: { chapter_number: number | null, chapter: string | null } = { chapter_number: null, chapter: null }
        
        try {
          // Get buffer if not already available
          if (!pdfBuffer && storagePathFinal) {
            const { data, error } = await supabaseAdmin.storage
              .from("learnchat-files")
              .download(storagePathFinal)
            if (!error && data) {
              pdfBuffer = Buffer.from(await data.arrayBuffer())
            }
          }
          
          if (pdfBuffer) {
            console.log(`[INGEST] Quick PDF title extraction starting...`)
            const { extractTextFromPDF } = await import("@/lib/ingestion/pdf")
            const pdfData = await extractTextFromPDF(pdfBuffer)
            const firstPageText = (pdfData.text || "").substring(0, 2000)
            
            // Extract title using our improved functions
            const firstHeading = extractFirstHeading(firstPageText)
            quickChapterInfo = extractChapter(firstPageText)
            
            if (quickChapterInfo.chapter_number && quickChapterInfo.chapter) {
              const chapterName = quickChapterInfo.chapter
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ')
              quickPdfTitle = chapterName // Just the chapter name, not "Chapter X — "
              console.log(`[INGEST] Quick extracted chapter title: "${quickPdfTitle}"`)
            } else if (firstHeading) {
              let cleanHeading = stripChapterPrefix(firstHeading.trim())
              if (cleanHeading.includes('\\') || cleanHeading.includes('/')) {
                cleanHeading = cleanHeading.split(/[\\\/]/).pop() || cleanHeading
              }
              cleanHeading = cleanHeading.replace(/\.(pmd|pdf)$/i, '')
              
              // Skip if it's a common word
              if (!isCommonWord(cleanHeading)) {
                quickPdfTitle = cleanHeading
                console.log(`[INGEST] Quick extracted heading: "${quickPdfTitle}"`)
              }
            }
            
            // Fallback to PDF metadata title
            if (!quickPdfTitle && pdfData.metadata?.info?.Title) {
              let metaTitle = pdfData.metadata.info.Title.trim()
              if (metaTitle.includes('\\') || metaTitle.includes('/')) {
                metaTitle = metaTitle.split(/[\\\/]/).pop() || metaTitle
              }
              metaTitle = metaTitle.replace(/\.(pmd|pdf)$/i, '')
              if (metaTitle && metaTitle.length > 3 && !isCommonWord(metaTitle)) {
                quickPdfTitle = metaTitle
                console.log(`[INGEST] Quick extracted from PDF metadata: "${quickPdfTitle}"`)
              }
            }
            
            // Fallback to filename
            if (!quickPdfTitle && file?.name) {
              quickPdfTitle = file.name.replace(/\.(pmd|pdf)$/i, '')
              console.log(`[INGEST] Using filename as title: "${quickPdfTitle}"`)
            }
          }
        } catch (e) {
          console.warn("[INGEST] Quick title extraction failed (non-blocking):", e)
        }
        
        title = quickPdfTitle || "Processing…"
        metadata = {
          storagePath: storagePathFinal || null,
          source: "pdf",
          display_title: quickPdfTitle || null,
          chapter: quickChapterInfo.chapter,
          chapter_number: quickChapterInfo.chapter_number,
        }
        source = "pdf"
        console.log(`[INGEST] PDF prepared with quick title: "${title}"`)
        break
      case "youtube":
        if (!url) {
          return NextResponse.json({ error: "URL required for YouTube" }, { status: 400 })
        }
        const { extractVideoId } = await import("@/lib/ingestion/youtube")
        const videoId = extractVideoId(url)
        if (!videoId) {
          return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 })
        }
        // Fetch title SYNCHRONOUSLY via YouTube Data API - this must complete before returning
        // This ensures the title is available immediately on the dashboard
        let ytTitle: string | null = null
        let ytThumb: string | null = null
        let ytChannelTitle: string | null = null
        
        // Try YouTube Data API first
        if (YOUTUBE_API_KEY) {
          try {
            console.log(`[INGEST] Fetching YouTube metadata for video: ${videoId}`)
            const ytRes = await fetch(
              `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`,
              { cache: 'no-store' } // Ensure fresh data
            )
            const ytJson = await ytRes.json()
            const snippet = ytJson?.items?.[0]?.snippet
            if (snippet) {
              ytTitle = snippet.title || null
              ytThumb = snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || null
              ytChannelTitle = snippet.channelTitle || null
              console.log(`[INGEST] YouTube API success - Title: "${ytTitle}"`)
            }
          } catch (e) {
            console.warn("YouTube API fetch failed:", e)
          }
        }
        
        // Fallback: Try oEmbed API if Data API fails (no API key required)
        if (!ytTitle) {
          try {
            console.log(`[INGEST] Trying oEmbed fallback for video: ${videoId}`)
            const oembedRes = await fetch(
              `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
              { cache: 'no-store' }
            )
            if (oembedRes.ok) {
              const oembedJson = await oembedRes.json()
              ytTitle = oembedJson.title || null
              ytChannelTitle = oembedJson.author_name || null
              console.log(`[INGEST] oEmbed success - Title: "${ytTitle}"`)
            }
          } catch (e) {
            console.warn("oEmbed fetch failed:", e)
          }
        }
        
        // Set thumbnail from YouTube CDN if not available from API
        if (!ytThumb) {
          ytThumb = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
        }
        
        title = ytTitle || "YouTube Video"
        thumbnail = ytThumb
        metadata = { 
          videoId, 
          source: "youtube", 
          title, 
          thumbnail,
          channelTitle: ytChannelTitle
        }
        source = "youtube"
        console.log(`[INGEST] YouTube content prepared with title: "${title}"`)
        break
      case "text":
        if (!text) {
          return NextResponse.json({ error: "Text required" }, { status: 400 })
        }
        title = extractFirstHeading(text) || "Text Content"
        metadata = { source: "text", display_title: title }
        source = "text"
        break
      default:
        return NextResponse.json({ error: "Invalid content type" }, { status: 400 })
    }

    // Create content record (sync, minimal)
    // For YouTube and PDF, set status to "ready" immediately if we have a proper title
    // This ensures the title shows on the dashboard right away
    const hasProperTitle = title && title !== "YouTube Video" && title !== "Processing…" && title !== "Content"
    const initialStatus = hasProperTitle ? "ready" : "processing"
    
    const content = await createContent({
      workspace_id: workspaceId,
      type: type as any,
      raw_url: url || undefined,
      extracted_text: type === "text" ? text || "" : "",
      metadata,
      title: title || metadata?.display_title || undefined,
      status: initialStatus,
      file_size: file ? file.size : undefined,
    })
    
    console.log(`[INGEST] Content created: id=${content?.id}, type=${type}, title="${title}", status=${initialStatus}`)

    if (!content) {
      return NextResponse.json(
        { error: "Failed to create content" },
        { status: 500 }
      )
    }

    // Process content in background for faster response (like YouLearn)
    // Return immediately after creating content record
    const analyze = async () => {
      try {
        if (type === "pdf") {
          const { extractTextFromPDF, chunkText: chunkPDF } = await import("@/lib/ingestion/pdf")
          let buffer: Buffer | null = null
          if (storagePathFinal) {
            const { data, error } = await supabaseAdmin.storage
              .from("learnchat-files")
              .download(storagePathFinal)
            if (!error && data) {
              buffer = Buffer.from(await data.arrayBuffer())
            }
          } else if (file) {
            buffer = Buffer.from(await file.arrayBuffer())
          }
          if (!buffer) {
            await updateContent(content.id, { status: "partial" })
            return
          }
          // Extract text from PDF (first page only for speed)
          const pdfData = await extractTextFromPDF(buffer)
          const firstPageText = (pdfData.text || "").substring(0, 2000) // First 2000 chars for speed
          
          // Quick title extraction using regex patterns (fast, no AI needed initially)
          const firstHeading = extractFirstHeading(firstPageText)
          const grade = extractGrade(firstPageText)
          const chapterInfo = extractChapter(firstPageText)
          
          // Quick title extraction - use AI in background for better accuracy
          let quickTitle: string
          if (chapterInfo.chapter_number && chapterInfo.chapter) {
            const chapterName = chapterInfo.chapter
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(' ')
            quickTitle = `Chapter ${chapterInfo.chapter_number} — ${chapterName}`
          } else if (firstHeading) {
            let cleanHeading = firstHeading.trim()
            if (cleanHeading.includes('\\') || cleanHeading.includes('/')) {
              cleanHeading = cleanHeading.split(/[\\\/]/).pop() || cleanHeading
            }
            cleanHeading = cleanHeading.replace(/\.(pmd|pdf)$/i, '')
            quickTitle = cleanHeading
          } else if (pdfData.metadata.info?.Title) {
            let metaTitle = pdfData.metadata.info.Title.trim()
            if (metaTitle.includes('\\') || metaTitle.includes('/')) {
              metaTitle = metaTitle.split(/[\\\/]/).pop() || metaTitle
            }
            metaTitle = metaTitle.replace(/\.(pmd|pdf)$/i, '')
            quickTitle = metaTitle
          } else {
            const fileName = file?.name || "Document"
            quickTitle = fileName.replace(/\.(pmd|pdf)$/i, '')
          }
          
          quickTitle = stripChapterPrefix(quickTitle)

          console.log(`[INGEST] Quick title for PDF: "${quickTitle}"`)
          
          // Use quick title immediately, AI will refine it in background
          const derivedTitle = quickTitle

          // Sanitize PDF text to remove null bytes before saving to database
          const sanitizedPdfText = sanitizeText(pdfData.text)

          const chunks = chunkPDF(sanitizedPdfText).map((chunk) => ({
            text: sanitizeText(chunk.text),
            metadata: { page: Math.floor(chunk.index / 5) + 1 },
          }))
          // Update content with quick title and mark as ready
          // AI will refine title in background
          await updateContent(content.id, {
            extracted_text: sanitizedPdfText,
            metadata: {
              ...(content.metadata || {}),
              pages: pdfData.metadata.pages,
              info: pdfData.metadata.info,
              grade,
              chapter: chapterInfo.chapter,
              chapter_number: chapterInfo.chapter_number,
              display_title: derivedTitle,
              source: "pdf",
              storagePath: storagePathFinal, // Ensure storagePath is saved
            },
            title: derivedTitle,
            status: "ready",
          })
          
          console.log(`[INGEST] PDF content ready: ${content.id}, title: "${derivedTitle}"`)
          await createProcessedContent({
            content_id: content.id,
            chunks,
          }).catch((e) => console.error("Processed content save error:", e))
          
          // Trigger fast AI title extraction from first page only (fire and forget)
          // This runs in background to refine the title quickly
          ;(async () => {
            try {
              // Use fast AI extraction from first page only
              const { getDefaultProvider, getLLMProvider, getProviderApiKey } = await import("@/lib/ai/providers")
              const { StringOutputParser } = await import("@langchain/core/output_parsers")
              const { PromptTemplate } = await import("@langchain/core/prompts")
              const { RunnableSequence } = await import("@langchain/core/runnables")
              
              const providerType = getDefaultProvider()
              const llm = getLLMProvider({
                provider: providerType,
                model: providerType === "groq" ? "llama-3.1-8b-instant" : "gpt-4o-mini", // Use fast models
                temperature: 0.3,
                apiKey: getProviderApiKey(providerType),
              })
              
              // Extract only first page text for speed
              const firstPageText = pdfData.text.substring(0, 1500) // Limit to 1500 chars for speed
              
              const prompt = `Extract the SPECIFIC CHAPTER/TOPIC title from this PDF. 

IMPORTANT RULES:
1. DO NOT use generic subject names like "Mathematics", "Science", "Physics", "Chemistry", "Biology", "English"
2. PREFER MULTI-WORD TITLES over single words (e.g., "A Square and a Cube" is better than "Lockers")
3. Look for ALL CAPS headings or Title Case text near the top - these are usually chapter titles
4. Common nouns from the story content (like "Lockers", "Queen", "Person") are NOT titles
5. Look for titles with "AND", "OF", "THE", "A" - these indicate full chapter titles

Text from first page:
${firstPageText}

Examples:
- "1 A SQUARE AND A CUBE" → return "A Square and a Cube"
- "POLYNOMIALS 2" or "2 POLYNOMIALS" → return "Polynomials"
- "Chapter 9 Gravitation" → return "Gravitation"
- "WORK AND ENERGY" with chapter number 11 → return "Work and Energy"
- If story mentions "lockers" but heading says "A SQUARE AND A CUBE" → return "A Square and a Cube"

Return ONLY the specific topic/chapter title in Title Case.
DO NOT include "Chapter X" prefix, just the title itself.
Return ONLY the title text, nothing else.`

              const promptTemplate = PromptTemplate.fromTemplate("{prompt}")
              const chain = RunnableSequence.from([
                promptTemplate,
                llm,
                new StringOutputParser(),
              ])
              
              const aiTitle = await chain.invoke({ prompt })
              let cleanAITitle = stripChapterPrefix(aiTitle.trim().replace(/^["']|["']$/g, '').trim())
              
              // Skip if AI returned a generic subject name or common word
              if (isGenericSubject(cleanAITitle) || isCommonWord(cleanAITitle)) {
                console.log(`[INGEST] AI returned generic/common word "${cleanAITitle}", keeping original title`)
                return
              }
              
              if (cleanAITitle && cleanAITitle.length > 3 && cleanAITitle.length < 200) {
                // Update with AI-extracted title
                await updateContent(content.id, {
                  metadata: {
                    ...(content.metadata || {}),
                    display_title: cleanAITitle,
                  },
                  title: cleanAITitle,
                })
                console.log(`[INGEST] AI title extracted: "${cleanAITitle}" for PDF: ${content.id}`)
              }
            } catch (aiError) {
              console.warn("AI title extraction failed (non-blocking):", aiError)
              // Continue with regex-extracted title
            }
          })().catch(() => {
            // Ignore errors - quick title is already set
          })
          
          // Generate summary asynchronously (fire and forget)
          ;(async () => {
            try {
              const { createSummarizationChain } = await import("@/lib/ai/chains")
              const { getDefaultProvider } = await import("@/lib/ai/providers")
              
              // Get workspace to find user
              const workspace = await getWorkspaceById(content.workspace_id)
              if (!workspace) return
              
              const user = await getUserById(workspace.user_id)
              const provider = (user?.ai_provider as any) || getDefaultProvider()
              
              // Get the extracted text
              const updatedContent = await getContentById(content.id)
              if (updatedContent?.extracted_text && updatedContent.extracted_text.trim().length > 0) {
                const summary = await createSummarizationChain(
                  updatedContent.extracted_text,
                  provider,
                  workspace.user_id
                )
                
                // Update processed content with summary
                const processed = await getProcessedContentByContentId(content.id)
                if (processed) {
                  await updateProcessedContent(processed.id, { summary })
                }
              }
            } catch (summaryError) {
              console.warn("Could not generate PDF summary:", summaryError)
              // Don't fail - PDF is still usable without summary
            }
          })().catch(() => {
            // Ignore errors
          })
          
          // Generate summary asynchronously
          try {
            // Get the authorization header from the original request to pass to /api/process
            const authHeader = req.headers.get('authorization')
            const headers: Record<string, string> = { "Content-Type": "application/json" }
            if (authHeader) {
              headers['Authorization'] = authHeader
            }

            const summaryResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/process`, {
              method: "POST",
              headers,
              body: JSON.stringify({ contentId: content.id }),
            })
            if (!summaryResponse.ok) {
              console.warn("Summary generation failed, but PDF is ready:", await summaryResponse.text())
            }
          } catch (summaryError) {
            console.warn("Could not trigger summary generation:", summaryError)
            // Don't fail - PDF is still usable without summary
          }
        } else if (type === "youtube") {
          const { getYouTubeTranscript, chunkTranscriptWithTimestamps } = await import("@/lib/ingestion/youtube")
          const videoId = (metadata as any).videoId
          let transcript: string | null = null
          let channelTitle: string | null = null
          let ytTitle: string | null = null
          let ytThumb: string | null = null

          // Fetch deterministic metadata
          if (YOUTUBE_API_KEY) {
            try {
              const ytRes = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`
              )
              const ytJson = await ytRes.json()
              const snippet = ytJson?.items?.[0]?.snippet
              if (snippet) {
                ytTitle = snippet.title
                ytThumb = snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || null
                channelTitle = snippet.channelTitle || null
              }
            } catch (e) {
              console.warn("YouTube metadata fetch error:", e)
            }
          }

          // Transcript (optional)
          try {
            const transcriptData = await getYouTubeTranscript(videoId, { videoUrl: url || undefined })
            transcript = transcriptData.transcript || null
            const chunks = transcript
              ? chunkTranscriptWithTimestamps(transcriptData.items).map((chunk) => ({
                  text: sanitizeText(chunk.text),
                  metadata: { timestamp: chunk.timestamp },
                }))
              : []
            if (transcript) {
              await createProcessedContent({ content_id: content.id, chunks }).catch((e) =>
                console.error("Processed content save error:", e)
              )
            }
          } catch (e) {
            console.warn("Transcript unavailable, continuing without captions.")
            transcript = null
          }

          await updateContent(content.id, {
            extracted_text: sanitizeText(transcript || ""),
            metadata: {
              ...(content.metadata || {}),
              videoId,
              title: ytTitle || content.title,
              thumbnail: ytThumb,
              channelTitle,
              source: "youtube",
            },
            title: ytTitle || content.title || "YouTube Video",
            status: transcript ? "ready" : "partial",
          })
          
          // Generate summary for YouTube content if transcript is available
          if (transcript && transcript.trim().length > 0) {
            console.log(`[INGEST] Summary generation started for YouTube content: ${content.id}, transcript length: ${transcript.length}`)
            try {
              const { createSummarizationChain } = await import("@/lib/ai/chains")
              const { getDefaultProvider } = await import("@/lib/ai/providers")
              
              const workspace = await getWorkspaceById(content.workspace_id)
              if (!workspace) {
                console.error(`[INGEST] Workspace not found for content: ${content.id}`)
              } else {
                const user = await getUserById(workspace.user_id)
                const provider = (user?.ai_provider as any) || getDefaultProvider()
                console.log(`[INGEST] Using AI provider: ${provider} for content: ${content.id}`)
                
                const summary = await createSummarizationChain(transcript, provider, workspace.user_id)
                console.log(`[INGEST] Summary generated, length: ${summary?.length || 0} for content: ${content.id}`)
                
                const processed = await getProcessedContentByContentId(content.id)
                if (!processed) {
                  console.error(`[INGEST] ProcessedContent not found for content: ${content.id}`)
                } else {
                  const updateResult = await updateProcessedContent(processed.id, { summary })
                  if (updateResult) {
                    console.log(`[INGEST] Summary saved to database for content: ${content.id}`)
                    await updateContent(content.id, { status: "complete" })
                    console.log(`[INGEST] Content status updated to complete: ${content.id}`)
                  } else {
                    console.error(`[INGEST] Failed to save summary for content: ${content.id}`)
                  }
                }
              }
            } catch (summaryError: any) {
              console.error(`[INGEST] Summary generation failed for content ${content.id}:`, summaryError?.message || summaryError)
              // Update status to indicate partial completion
              await updateContent(content.id, { status: "ready" })
            }
          } else {
            console.log(`[INGEST] No transcript available for YouTube content: ${content.id}, skipping summary`)
          }
        } else if (type === "text") {
          const { chunkText } = await import("@/lib/ingestion/text")
          const baseText = sanitizeText(text || "")
          const chunks = chunkText(baseText).map((chunk) => ({ text: sanitizeText(chunk.text) }))
          await createProcessedContent({ content_id: content.id, chunks }).catch((e) =>
            console.error("Processed content save error:", e)
          )
          await updateContent(content.id, {
            status: "ready",
            title: content.title,
          })
          
          // Generate summary for text content
          if (baseText.trim().length > 0) {
            console.log(`[INGEST] Summary generation started for text content: ${content.id}, text length: ${baseText.length}`)
            try {
              const { createSummarizationChain } = await import("@/lib/ai/chains")
              const { getDefaultProvider } = await import("@/lib/ai/providers")
              
              const workspace = await getWorkspaceById(content.workspace_id)
              if (!workspace) {
                console.error(`[INGEST] Workspace not found for text content: ${content.id}`)
              } else {
                const user = await getUserById(workspace.user_id)
                const provider = (user?.ai_provider as any) || getDefaultProvider()
                console.log(`[INGEST] Using AI provider: ${provider} for text content: ${content.id}`)
                
                const summary = await createSummarizationChain(baseText, provider, workspace.user_id)
                console.log(`[INGEST] Summary generated, length: ${summary?.length || 0} for text content: ${content.id}`)
                
                const processed = await getProcessedContentByContentId(content.id)
                if (!processed) {
                  console.error(`[INGEST] ProcessedContent not found for text content: ${content.id}`)
                } else {
                  const updateResult = await updateProcessedContent(processed.id, { summary })
                  if (updateResult) {
                    console.log(`[INGEST] Summary saved to database for text content: ${content.id}`)
                    await updateContent(content.id, { status: "complete" })
                    console.log(`[INGEST] Content status updated to complete: ${content.id}`)
                  } else {
                    console.error(`[INGEST] Failed to save summary for text content: ${content.id}`)
                  }
                }
              }
            } catch (summaryError: any) {
              console.error(`[INGEST] Summary generation failed for text content ${content.id}:`, summaryError?.message || summaryError)
              await updateContent(content.id, { status: "ready" })
            }
          } else {
            console.log(`[INGEST] Empty text content: ${content.id}, skipping summary`)
          }
        }
      } catch (err) {
        console.error("Background analysis error:", err)
        await updateContent(content.id, { status: "partial" })
      }
    }

    // Process everything in background for faster response (like YouLearn)
    // Return immediately - processing happens async
    analyze().catch((e) => console.error("Async analyze failed:", e))

    // Return immediately with content ID
    return NextResponse.json({
      success: true,
      contentId: content.id,
      message: "Content uploaded successfully. Processing in background...",
    })
  } catch (error: any) {
    console.error("Ingestion error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to ingest content" },
      { status: 500 }
    )
  }
}

