import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth/middleware"
import { getContentById, updateContent } from "@/lib/db/queries"
import { getDefaultProvider, getLLMProvider, getProviderApiKey } from "@/lib/ai/providers"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { PromptTemplate } from "@langchain/core/prompts"
import { RunnableSequence } from "@langchain/core/runnables"

// Hyphen escaped to avoid "range out of order" parse errors
const stripChapterPrefix = (title: string) =>
  title.replace(/^chapter\s+\d+\s*[—–\-:]*\s*/i, "").trim()

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
  // Single letters/numbers
  'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
]

const isCommonWord = (text: string): boolean => {
  const normalized = text.trim().toUpperCase()
  // Direct match
  if (COMMON_WORDS.includes(normalized)) return true
  // Check without leading Roman numerals or numbers (e.g., "I. INTRODUCTION" -> "INTRODUCTION")
  const withoutPrefix = normalized.replace(/^(I{1,3}|IV|VI{0,3}|IX|X{1,3}|\d+)\.?\s*/i, '')
  if (COMMON_WORDS.includes(withoutPrefix)) return true
  return false
}

/**
 * Classify PDF document and generate intelligent title
 * Extracts first 2-3 pages, sends to LLM for classification
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ contentId: string }> | { contentId: string } }
) {
  try {
    const auth = await authenticateRequest(req)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Handle both Promise and direct params (Next.js 13+ compatibility)
    const resolvedParams = await Promise.resolve(params)
    const contentId = resolvedParams.contentId

    const content = await getContentById(contentId)
    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 })
    }

    if (content.type !== "pdf") {
      return NextResponse.json({ error: "Only PDFs can be classified" }, { status: 400 })
    }

    // Get storage path
    const storagePath = content.metadata && typeof content.metadata === "object"
      ? (content.metadata as any).storagePath
      : null

    if (!storagePath) {
      return NextResponse.json({ error: "PDF storage path not found" }, { status: 404 })
    }

    // Fetch PDF URL
    const pdfUrlResponse = await fetch(`${req.nextUrl.origin}/api/content/${contentId}/pdf-url`)
    if (!pdfUrlResponse.ok) {
      return NextResponse.json({ error: "Failed to get PDF URL" }, { status: 500 })
    }
    const { url: pdfUrl } = await pdfUrlResponse.json()

    // Extract text from first 2-3 pages using PDF.js
    const pdfjs = await import("pdfjs-dist")
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

    const loadingTask = pdfjs.getDocument({
      url: pdfUrl,
      withCredentials: false,
    })

    const pdfDoc = await loadingTask.promise
    // Extract only first page for speed (like YouLearn)
    const page = await pdfDoc.getPage(1)
    const textContent = await page.getTextContent()
    const extractedText = textContent.items
      .map((item: any) => item.str)
      .join(" ")
      .substring(0, 2000) // Limit to 2000 chars for speed

    if (!extractedText.trim()) {
      return NextResponse.json({ error: "Could not extract text from PDF" }, { status: 400 })
    }

    // Use fast AI model for quick title extraction
    const providerType = getDefaultProvider()
    const llm = getLLMProvider({
      provider: providerType,
      model: providerType === "groq" ? "llama-3.1-8b-instant" : "gpt-4o-mini", // Fast models
      temperature: 0.3,
      apiKey: getProviderApiKey(providerType),
    })
    
    const prompt = `Extract the MAIN TITLE from this PDF document.

CRITICAL RULES:
1. DO NOT use section headings as the title. Skip these: "Introduction", "Abstract", "Methodology", "Methods", "Results", "Discussion", "Conclusion", "References"
2. DO NOT use Roman numeral sections like "I. INTRODUCTION", "II. METHODS" as titles
3. DO NOT use numbered sections like "1. Introduction", "2. Background" as titles
4. For RESEARCH PAPERS: The title is the first large text BEFORE author names and before "Abstract"
5. For TEXTBOOKS/CHAPTERS: Look for the chapter name, not section headings
6. PREFER LONGER, DESCRIPTIVE TITLES (5+ words) over short section names

First page text:
${extractedText}

Return ONLY a JSON object with this format:
{
  "display_title": "The main document/paper/chapter title (NOT a section heading)",
  "document_type": "Research Paper" | "Textbook" | "Notes" | "Exam" | "Slides" | "Article" | "Other",
  "subject": "string (Computer Science, Mathematics, Physics, etc.)",
  "grade": number | null,
  "book_name": "string" | null,
  "chapter": "string (for textbooks only)",
  "chapter_number": number | null
}

Examples:
- Paper title "Automated Trading System for Stock Index Using LSTM Neural Networks" followed by authors → display_title: "Automated Trading System for Stock Index Using LSTM Neural Networks"
- "I. INTRODUCTION" appears but actual title is "Deep Learning for Image Recognition" → display_title: "Deep Learning for Image Recognition"
- Textbook chapter "1 A SQUARE AND A CUBE" → display_title: "A Square and a Cube", chapter_number: 1
- "Abstract" section appears after "Machine Learning in Healthcare" → display_title: "Machine Learning in Healthcare"
- WRONG: "I. INTRODUCTION" or "1. Introduction" as display_title
- CORRECT: The actual paper/document title that appears before authors/abstract`

    // Use StringOutputParser to get text response
    const promptTemplate = PromptTemplate.fromTemplate("{prompt}")
    const chain = RunnableSequence.from([
      promptTemplate,
      llm,
      new StringOutputParser(),
    ])
    
    const responseText = await chain.invoke({ prompt })
    
    // Parse JSON from response
    let classification: any = {}
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || 
                       responseText.match(/```\s*([\s\S]*?)\s*```/) ||
                       [null, responseText]
      
      const jsonText = jsonMatch[1] || responseText
      classification = JSON.parse(jsonText.trim())
    } catch (parseError) {
      // Fallback: try to parse the entire response
      try {
        classification = JSON.parse(responseText)
      } catch {
        // If all parsing fails, create a basic classification
        classification = {
          display_title: content.metadata?.title || "PDF Document",
          document_type: "Other",
          subject: "General",
          grade: null,
          book_name: null,
          chapter: null,
          chapter_number: null,
        }
      }
    }

    // Clean and normalize title
    let cleanedDisplayTitle = classification.display_title
      ? stripChapterPrefix(String(classification.display_title))
      : stripChapterPrefix(content.metadata?.title || "PDF Document")
    
    // Reject single-word common words - prefer multi-word titles
    if (isCommonWord(cleanedDisplayTitle)) {
      console.log(`[CLASSIFY] Rejected common word title: "${cleanedDisplayTitle}"`)
      // Try to use a better title from classification
      if (classification.chapter && !isCommonWord(classification.chapter)) {
        cleanedDisplayTitle = classification.chapter
      } else {
        cleanedDisplayTitle = "PDF Document"
      }
    }
    
    classification.display_title = cleanedDisplayTitle || "PDF Document"

    // Update content metadata with classification
    const updatedMetadata = {
      ...(content.metadata && typeof content.metadata === "object" ? content.metadata : {}),
      display_title: classification.display_title,
      document_type: classification.document_type,
      subject: classification.subject,
      grade: classification.grade,
      book_name: classification.book_name,
      chapter: classification.chapter,
      chapter_number: classification.chapter_number,
      classified_at: new Date().toISOString(),
    }

    await updateContent(contentId, {
      metadata: updatedMetadata,
      title: classification.display_title, // Also update the title field
    })

    return NextResponse.json({
      success: true,
      classification,
    })
  } catch (error: any) {
    console.error("Document classification error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to classify document" },
      { status: 500 }
    )
  }
}

