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

