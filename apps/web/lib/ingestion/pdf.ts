// IMPORTANT:
// We import the inner implementation from pdf-parse/lib/pdf-parse
// instead of the package root. The package root (index.js) contains
// test/debug code that tries to read a local file:
// './test/data/05-versions-space.pdf'
// In a bundled/Next.js environment this path does not exist, which
// causes ENOENT errors at require-time. Importing the inner module
// bypasses that debug code and uses pdf.js directly on the buffer.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdf: (buffer: Buffer) => Promise<{
  numpages: number
  info: any
  text: string
}> = require("pdf-parse/lib/pdf-parse")

export async function extractTextFromPDF(buffer: Buffer): Promise<{
  text: string
  metadata: {
    pages: number
    info: any
  }
}> {
  try {
    if (!buffer || buffer.length === 0) {
      throw new Error("PDF buffer is empty or invalid")
    }

    const data = await pdf(buffer)
    
    if (!data || !data.text) {
      throw new Error("PDF parsing returned no text content. The PDF might be image-based or encrypted.")
    }

    const extractedText = data.text.trim()
    
    if (extractedText.length === 0) {
      throw new Error("PDF contains no extractable text. The PDF might be image-based (scanned document) or contain only images.")
    }
    
    return {
      text: extractedText,
      metadata: {
        pages: data.numpages || 0,
        info: data.info || {},
      },
    }
  } catch (error: any) {
    const errorMessage = error?.message || String(error)
    
    // Provide more helpful error messages
    if (errorMessage.includes("password") || errorMessage.includes("encrypted")) {
      throw new Error("PDF is password-protected or encrypted. Please provide an unlocked version.")
    }
    
    if (errorMessage.includes("Invalid PDF")) {
      throw new Error("Invalid PDF file format. Please ensure the file is a valid PDF.")
    }
    
    if (errorMessage.includes("image") || errorMessage.includes("scanned")) {
      throw new Error("PDF appears to be image-based (scanned document). Please use OCR or paste the text manually using the Text upload option.")
    }
    
    // Re-throw with original message if no specific case matched
    throw new Error(`PDF extraction failed: ${errorMessage}`)
  }
}

export function chunkText(
  text: string,
  chunkSize: number = 1000,
  overlap: number = 200
): Array<{ text: string; index: number }> {
  const chunks: Array<{ text: string; index: number }> = []
  let start = 0
  let index = 0

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length)
    let chunkText = text.slice(start, end)

    // Try to break at sentence boundaries
    if (end < text.length) {
      const lastPeriod = chunkText.lastIndexOf(".")
      const lastNewline = chunkText.lastIndexOf("\n")
      const breakPoint = Math.max(lastPeriod, lastNewline)

      if (breakPoint > chunkSize * 0.5) {
        chunkText = text.slice(start, start + breakPoint + 1)
        start = start + breakPoint + 1 - overlap
      } else {
        start = end - overlap
      }
    } else {
      start = end
    }

    chunks.push({
      text: chunkText.trim(),
      index,
    })
    index++
  }

  return chunks
}

