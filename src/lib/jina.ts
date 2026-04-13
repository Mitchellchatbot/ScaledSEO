import { ExtractedContent, SerpResult } from '@/types'

const JINA_BASE = 'https://r.jina.ai'
const TIMEOUT_MS = 15_000
const MIN_CONTENT_LENGTH = 200

export async function extractAllContent(
  serpResults: SerpResult[]
): Promise<ExtractedContent[]> {
  const results = await Promise.allSettled(
    serpResults.map((result) => extractOne(result.link, result.title))
  )

  return results.map((result, i) => {
    if (result.status === 'fulfilled') return result.value
    return {
      url: serpResults[i].link,
      title: serpResults[i].title,
      content: null,
      word_count: 0,
      error: String(result.reason),
    }
  })
}

async function extractOne(url: string, fallbackTitle: string): Promise<ExtractedContent> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const apiKey = process.env.JINA_API_KEY
    const headers: Record<string, string> = {
      Accept: 'text/markdown',
    }
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`

    const response = await fetch(`${JINA_BASE}/${url}`, {
      headers,
      signal: controller.signal,
    })

    clearTimeout(timer)

    if (!response.ok) {
      return { url, title: fallbackTitle, content: null, word_count: 0, error: `HTTP ${response.status}` }
    }

    const text = await response.text()

    // Detect bot-blocked or login-gated pages
    const lowerText = text.toLowerCase()
    if (
      lowerText.includes('access denied') ||
      lowerText.includes('403 forbidden') ||
      lowerText.includes('sign in to continue') ||
      text.length < MIN_CONTENT_LENGTH
    ) {
      return { url, title: fallbackTitle, content: null, word_count: 0, error: 'blocked_or_empty' }
    }

    // Extract title from first markdown H1 if present
    const h1Match = text.match(/^#\s+(.+)$/m)
    const title = h1Match ? h1Match[1].trim() : fallbackTitle

    const wordCount = text.trim().split(/\s+/).filter(Boolean).length

    return { url, title, content: text, word_count: wordCount, error: null }
  } catch (err) {
    clearTimeout(timer)
    const isTimeout = err instanceof Error && err.name === 'AbortError'
    return {
      url,
      title: fallbackTitle,
      content: null,
      word_count: 0,
      error: isTimeout ? 'timeout' : String(err),
    }
  }
}
